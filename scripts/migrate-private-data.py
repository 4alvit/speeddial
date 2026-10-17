#!/usr/bin/env python3
"""Prepare and verify offline private data. Never connects to a running service."""
import argparse
import base64
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import secrets
import shutil
import sqlite3
import stat
import struct
import sys
import tarfile
import tempfile

MANIFEST = 'migration-manifest.json'
DATABASE = 'speeddial.sqlite'
DATABASE_FILES = {DATABASE, DATABASE + '-wal', DATABASE + '-shm'}
IMAGE_DIRS = ('images', 'legacy-images')
AUTH_FILES = {'session.key', 'session-key', 'access-token'}
MAX_ARCHIVE_BYTES = 5 * 1024 ** 3


class PreparationError(Exception):
    """Only fixed, non-sensitive error codes are reported to stdout."""


def fail(code):
    raise PreparationError(code)


def sha256(file):
    digest = hashlib.sha256()
    with file.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def checked_file(file):
    if not stat.S_ISREG(file.lstat().st_mode):
        fail('NON_REGULAR_FILE')
    return file


def checked_dir(directory):
    if not stat.S_ISDIR(directory.lstat().st_mode):
        fail('NON_REGULAR_DIRECTORY')
    return directory


def image_inventory(directory):
    if directory.is_symlink():
        fail('NON_REGULAR_DIRECTORY')
    if not directory.exists():
        return {}
    checked_dir(directory)
    result = {}
    for root, dirs, files in os.walk(directory, followlinks=False):
        for name in dirs:
            checked_dir(Path(root) / name)
        for name in files:
            file = checked_file(Path(root) / name)
            result[file.relative_to(directory).as_posix()] = sha256(file)
    return result


def private_copy(source, destination):
    checked_file(source)
    destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with source.open('rb') as incoming, destination.open('xb') as outgoing:
        os.chmod(destination, 0o600)
        shutil.copyfileobj(incoming, outgoing, 1024 * 1024)


def copy_image_tree(source, destination):
    files = image_inventory(source)
    existing = image_inventory(destination)
    destination.mkdir(mode=0o700, parents=True, exist_ok=True)
    for name, digest in files.items():
        if name in existing:
            if existing[name] != digest:
                fail('IMAGE_COPY_CONFLICT')
        else:
            private_copy(source / name, destination / name)
    if image_inventory(destination) != {**existing, **files}:
        fail('IMAGE_COPY_MISMATCH')


def copy_source_directory(source, destination):
    checked_dir(source)
    for name in DATABASE_FILES:
        candidate = source / name
        if candidate.exists() or candidate.is_symlink():
            private_copy(candidate, destination / name)
    if not (destination / DATABASE).is_file():
        fail('DATABASE_MISSING')
    for name in IMAGE_DIRS:
        copy_image_tree(source / name, destination / name)


def archive_path(name):
    path = PurePosixPath(name)
    if not name or path.is_absolute() or '..' in path.parts or '\\' in name:
        fail('UNSAFE_ARCHIVE_ENTRY')
    return path


def copy_source_archive(archive, destination):
    checked_file(archive)
    with tarfile.open(archive, 'r:*') as stream:
        members = stream.getmembers()
        if sum(member.size for member in members) > MAX_ARCHIVE_BYTES:
            fail('ARCHIVE_TOO_LARGE')
        seen = set()
        entries = []
        for member in members:
            path = archive_path(member.name)
            if path in seen:
                fail('DUPLICATE_ARCHIVE_ENTRY')
            seen.add(path)
            if not (member.isfile() or member.isdir()):
                fail('UNSAFE_ARCHIVE_ENTRY')
            entries.append((member, path))
        databases = [path for member, path in entries if member.isfile() and path.name == DATABASE]
        if len(databases) != 1:
            fail('DATABASE_MISSING_OR_AMBIGUOUS')
        prefix = databases[0].parent
        for member, path in entries:
            if not path.is_relative_to(prefix):
                # A directory enclosing the data prefix is harmless; sibling files are not.
                if member.isdir() and prefix.is_relative_to(path):
                    continue
                fail('UNEXPECTED_ARCHIVE_ROOT')
            relative = path.relative_to(prefix)
            if member.isdir():
                continue
            # Auth and unknown files are deliberately never copied or read.
            selected = relative.as_posix() in DATABASE_FILES or (
                len(relative.parts) > 1 and relative.parts[0] in IMAGE_DIRS)
            if not selected:
                continue
            target = destination / relative
            target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            with stream.extractfile(member) as incoming, target.open('xb') as outgoing:
                os.chmod(target, 0o600)
                shutil.copyfileobj(incoming, outgoing, 1024 * 1024)


def fingerprint(rows):
    digest = hashlib.sha256()
    for row in rows:
        for item in row:
            value = item if isinstance(item, bytes) else str(item).encode('utf-8')
            digest.update(struct.pack('>Q', len(value)))
            digest.update(value)
    return digest.hexdigest()


def read_database(connection):
    if connection.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
        fail('SQLITE_INTEGRITY_FAILED')
    boards = connection.execute('SELECT id, CAST(value AS BLOB) FROM board ORDER BY id').fetchall()
    history = connection.execute('SELECT id, CAST(created AS BLOB), CAST(value AS BLOB) FROM history ORDER BY id').fetchall()
    if len(boards) != 1 or boards[0][0] != 1:
        fail('INVALID_BOARD_TABLE')
    references = set()
    tile_count = 0
    for index, row in enumerate(boards + history):
        value = json.loads(row[-1])
        if not isinstance(value, dict) or not isinstance(value.get('tiles'), list):
            fail('INVALID_BOARD_VALUE')
        if index == 0:
            tile_count = len(value['tiles'])
        for tile in value['tiles']:
            if not isinstance(tile, dict):
                fail('INVALID_TILE')
            image = tile.get('image')
            if image is None:
                continue
            if not isinstance(image, str):
                fail('INVALID_IMAGE_REFERENCE')
            if image.startswith('/legacy/images/'):
                kind, suffix = 'legacy-images', image[len('/legacy/images/'):]
            elif image.startswith('/images/'):
                kind, suffix = 'images', image[len('/images/'):]
            else:
                fail('UNSUPPORTED_IMAGE_REFERENCE')
            relative = archive_path(suffix)
            if relative.as_posix() != suffix or not relative.parts:
                fail('INVALID_IMAGE_REFERENCE')
            references.add(kind + '/' + suffix)
    return {
        'board_sha256': fingerprint(boards), 'history_sha256': fingerprint(history),
        'board_rows': len(boards), 'history_rows': len(history), 'tiles': tile_count,
    }, references


def read_only_database(file):
    return sqlite3.connect(file.resolve().as_uri() + '?mode=ro', uri=True)


def inspect_snapshot(snapshot):
    files = {}
    for kind in IMAGE_DIRS:
        files.update({kind + '/' + name: digest for name, digest in image_inventory(snapshot / kind).items()})
    with closing(read_only_database(snapshot / DATABASE)) as database:
        logical, references = read_database(database)
    if not references.issubset(files):
        fail('REFERENCED_IMAGE_MISSING')
    return logical, files, len(references)


def seal_snapshot(snapshot, logical, files, reference_count):
    manifest = {
        'format': 1, 'integrity': 'ok', **logical,
        'referenced_images': reference_count,
        'database_sha256': sha256(snapshot / DATABASE), 'image_sha256': files,
    }
    with (snapshot / MANIFEST).open('x', encoding='utf-8') as output:
        os.chmod(snapshot / MANIFEST, 0o600)
        json.dump(manifest, output, indent=2, sort_keys=True)
        output.write('\n')
    return manifest


def consolidate(source, destination):
    with closing(read_only_database(source / DATABASE)) as incoming:
        before, _ = read_database(incoming)
        with closing(sqlite3.connect(destination / DATABASE)) as outgoing:
            os.chmod(destination / DATABASE, 0o600)
            incoming.backup(outgoing)
            outgoing.execute('PRAGMA journal_mode=DELETE')
            after, _ = read_database(outgoing)
    if before != after:
        fail('SQLITE_VALUES_CHANGED')
    return before


def destination_available(destination):
    if destination.exists() or destination.is_symlink():
        fail('DESTINATION_EXISTS')
    checked_dir(destination.parent)


def publish(prepared, destination):
    # Exclusive mkdir prevents clobbering an existing or live DATA_DIR. The
    # manifest is copied last; interrupted outputs fail verify and are not reused.
    destination.mkdir(mode=0o700)
    try:
        private_copy(prepared / DATABASE, destination / DATABASE)
        for kind in IMAGE_DIRS:
            copy_image_tree(prepared / kind, destination / kind)
        private_copy(prepared / MANIFEST, destination / MANIFEST)
    except BaseException:
        shutil.rmtree(destination)
        raise


def summary(manifest, action, execute=False):
    return {
        'action': action, 'mode': 'executed' if execute else 'dry-run', 'integrity': 'ok',
        'tiles': manifest['tiles'], 'board_rows': manifest['board_rows'],
        'history_rows': manifest['history_rows'], 'referenced_images': manifest['referenced_images'],
        'legacy_images': sum(name.startswith('legacy-images/') for name in manifest['image_sha256']),
        'runtime_images': sum(name.startswith('images/') for name in manifest['image_sha256']),
        'auth_files_copied': 0, 'board_history_unchanged': True,
    }


def migration(args):
    destination = Path(args.destination)
    destination_available(destination)
    with tempfile.TemporaryDirectory(prefix='speeddial-private-migration-') as temporary:
        workspace = Path(temporary)
        incoming, prepared = workspace / 'incoming', workspace / 'prepared'
        incoming.mkdir(mode=0o700)
        prepared.mkdir(mode=0o700)
        if args.source_archive:
            copy_source_archive(Path(args.source_archive), incoming)
        else:
            copy_source_directory(Path(args.source_dir), incoming)
        checked_dir(Path(args.legacy_images))
        copy_image_tree(Path(args.legacy_images), incoming / 'legacy-images')
        logical = consolidate(incoming, prepared)
        for kind in IMAGE_DIRS:
            copy_image_tree(incoming / kind, prepared / kind)
        actual, files, references = inspect_snapshot(prepared)
        if actual != logical:
            fail('SQLITE_VALUES_CHANGED')
        manifest = seal_snapshot(prepared, logical, files, references)
        if args.execute:
            publish(prepared, destination)
        return summary(manifest, 'migrate', args.execute)


def verified_snapshot(source, temporary):
    checked_dir(source)
    for name in AUTH_FILES:
        if (source / name).exists() or (source / name).is_symlink():
            fail('AUTH_FILE_IN_SNAPSHOT')
    manifest = json.loads(checked_file(source / MANIFEST).read_text(encoding='utf-8'))
    if not isinstance(manifest, dict) or manifest.get('format') != 1:
        fail('UNSUPPORTED_MANIFEST')
    copy_source_directory(source, temporary)
    if sha256(temporary / DATABASE) != manifest.get('database_sha256'):
        fail('DATABASE_HASH_MISMATCH')
    # A sealed, consolidated snapshot has no journals. Their presence means it
    # may have been opened by a writer since preparation and needs re-snapshotting.
    if any((source / name).exists() for name in DATABASE_FILES - {DATABASE}):
        fail('SNAPSHOT_HAS_JOURNALS')
    logical, files, references = inspect_snapshot(temporary)
    if any(manifest.get(key) != value for key, value in logical.items()):
        fail('SQLITE_VALUES_CHANGED')
    if files != manifest.get('image_sha256') or references != manifest.get('referenced_images'):
        fail('IMAGE_HASH_MISMATCH')
    return manifest


def verification(args):
    with tempfile.TemporaryDirectory(prefix='speeddial-private-verify-') as temporary:
        manifest = verified_snapshot(Path(args.source_dir), Path(temporary))
        result = summary(manifest, 'verify')
        result['mode'] = 'read-only'
        return result


def rollback(args):
    destination = Path(args.destination)
    destination_available(destination)
    with tempfile.TemporaryDirectory(prefix='speeddial-private-rollback-') as temporary:
        workspace = Path(temporary)
        incoming, prepared = workspace / 'incoming', workspace / 'prepared'
        incoming.mkdir(mode=0o700)
        prepared.mkdir(mode=0o700)
        expected = verified_snapshot(Path(args.source_dir), incoming)
        logical = consolidate(incoming, prepared)
        for kind in IMAGE_DIRS:
            copy_image_tree(incoming / kind, prepared / kind)
        actual, files, references = inspect_snapshot(prepared)
        if actual != logical or files != expected['image_sha256']:
            fail('ROLLBACK_COPY_MISMATCH')
        manifest = seal_snapshot(prepared, logical, files, references)
        if args.execute:
            publish(prepared, destination)
        return summary(manifest, 'rollback', args.execute)


def credentials(args):
    destination = Path(args.destination)
    destination_available(destination)
    if args.execute:
        destination.mkdir(mode=0o700)
        try:
            for name, value in [('access-token', base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b'=') + b'\n'),
                                ('session-key', secrets.token_bytes(48))]:
                with (destination / name).open('xb') as output:
                    os.chmod(destination / name, 0o600)
                    output.write(value)
        except BaseException:
            shutil.rmtree(destination)
            raise
    return {'action': 'credentials', 'mode': 'executed' if args.execute else 'dry-run',
            'credential_files': 2, 'contents_printed': False, 'overwrites_allowed': False}


class PrivateArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        fail('INVALID_ARGUMENTS')


def main(argv=None):
    os.umask(0o077)
    parser = PrivateArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    migrate = sub.add_parser('migrate', help='Prepare a new data-only offline snapshot; dry-run by default.')
    sources = migrate.add_mutually_exclusive_group(required=True)
    sources.add_argument('--source-archive')
    sources.add_argument('--source-dir')
    migrate.add_argument('--legacy-images', required=True)
    migrate.add_argument('--destination', required=True)
    migrate.add_argument('--execute', action='store_true')
    verify = sub.add_parser('verify', help='Read-only verification of a sealed prepared snapshot.')
    verify.add_argument('--source-dir', required=True)
    restore = sub.add_parser('rollback', help='Prepare a data-only restore in a NEW directory, never auth or deployment.')
    restore.add_argument('--source-dir', required=True)
    restore.add_argument('--destination', required=True)
    restore.add_argument('--execute', action='store_true')
    keys = sub.add_parser('credentials', help='Prepare fresh local access/signing files; dry-run by default.')
    keys.add_argument('--destination', required=True)
    keys.add_argument('--execute', action='store_true')
    try:
        args = parser.parse_args(argv)
        result = {'migrate': migration, 'verify': verification, 'rollback': rollback, 'credentials': credentials}[args.action](args)
        print(json.dumps(result, sort_keys=True))
        return 0
    except PreparationError as error:
        print(json.dumps({'status': 'error', 'code': str(error)}))
    except KeyboardInterrupt:
        print(json.dumps({'status': 'error', 'code': 'INTERRUPTED'}))
    except Exception:
        # Malformed private inputs and OS/SQLite errors must never leak paths,
        # stored values, or credentials through exception messages/tracebacks.
        print(json.dumps({'status': 'error', 'code': 'OFFLINE_PREPARATION_FAILED'}))
    return 1


if __name__ == '__main__':
    sys.exit(main())
