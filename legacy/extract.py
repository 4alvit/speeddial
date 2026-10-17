#!/usr/bin/env python3
"""Convert a local archived Speed Dial page to an explicit import file.

No JavaScript is executed and no URLs are fetched. Input and output locations
must be supplied explicitly. Treat generated bookmarks, images, and provenance
as private data; do not commit them to a public repository.
"""
import argparse
from base64 import b64decode
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote_to_bytes, unquote
import json
import re


class DialParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.anchor = None
        self.picture = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'link' in attrs.get('class', '').split():
            self.anchor = attrs
        if tag == 'img' and self.anchor is not None and self.picture is None:
            self.picture = attrs


def extract(html_path, output, encoding='windows-1252', source_url=None,
            manifest_path=None, expected_count=None):
    html_path, output = Path(html_path).resolve(), Path(output).resolve()
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output directory must be empty to avoid replacing existing private data')
    raw_html = html_path.read_bytes()
    html = raw_html.decode(encoding)
    if '<div id="dials"' not in html:
        raise ValueError('Input does not contain the expected Speed Dial grid')
    dials = html.split('<div id="dials"', 1)[1].split('<div id="closedTabsBar"', 1)[0]
    chunks = list(re.finditer(r'<div id="(slot[0-9]+)" class="slot"', dials))
    if not chunks:
        raise ValueError('No supported Speed Dial slots were found')
    tiles, provenance, images = [], [], {}
    seen_slots = set()
    mime_extensions = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp'}
    for i, chunk in enumerate(chunks):
        end = chunks[i + 1].start() if i + 1 < len(chunks) else len(dials)
        parsed = DialParser()
        parsed.feed(dials[chunk.start():end])
        if not parsed.anchor or not parsed.picture:
            raise ValueError('Each slot must contain a link and image')
        anchor, picture = parsed.anchor, parsed.picture
        target = urlsplit(anchor.get('href', ''))
        if target.scheme not in ('http', 'https') or not target.hostname or target.username or target.password:
            raise ValueError('Bookmark URLs must use HTTP(S) without embedded credentials')
        source = picture.get('src', '')
        if source.startswith('data:'):
            header, data = source.split(',', 1)
            mime = header[5:].split(';', 1)[0]
            if mime not in mime_extensions:
                raise ValueError('Only PNG, JPEG, WebP, and GIF images are supported')
            extension = mime_extensions[mime]
            image = b64decode(data, validate=True) if ';base64' in header else unquote_to_bytes(data)
            image_origin = 'embedded data URI'
        else:
            resource = urlsplit(source)
            if resource.scheme or resource.netloc or resource.query or resource.fragment:
                raise ValueError('Image references must be local paths without queries or fragments')
            source_path = (html_path.parent / unquote(resource.path)).resolve()
            if html_path.parent not in source_path.parents:
                raise ValueError('Image path escapes the input directory')
            extension = source_path.suffix.lower()
            if extension not in mime_extensions.values() and extension != '.jpeg':
                raise ValueError('Unsupported image file extension')
            image = source_path.read_bytes()
            image_origin = 'local image file'
        if not image or len(image) > 5 * 1024 * 1024:
            raise ValueError('Image must contain 1 byte to 5 MiB')
        slot = chunk.group(1)
        if slot in seen_slots:
            raise ValueError('Duplicate slot IDs are not supported')
        seen_slots.add(slot)
        filename = slot + extension
        images[filename] = image
        title = anchor.get('title', '') or picture.get('alt', '') or target.hostname
        if len(title) > 300:
            raise ValueError('Bookmark titles must not exceed 300 characters')
        tile = {'id': 'legacy-' + chunk.group(1), 'title': title,
                'url': anchor['href'], 'image': '/legacy/images/' + filename}
        tiles.append(tile)
        provenance.append({'id': tile['id'], 'originalSlot': chunk.group(1),
                           'imageOrigin': image_origin, 'imagePath': 'legacy-images/' + filename,
                           'imageSha256': sha256(image).hexdigest()})
    if expected_count is not None and len(tiles) != expected_count:
        raise ValueError('Extracted tile count does not match --expected-count')
    info = {'sourceKind': 'local archived HTML', 'htmlEncoding': encoding,
            'htmlSha256': sha256(raw_html).hexdigest(), 'tileCount': len(tiles), 'tiles': provenance}
    if source_url:
        info['sourceUrl'] = source_url
    if manifest_path:
        manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8'))
        info['extensionName'] = manifest.get('name')
        info['extensionVersion'] = manifest.get('version')
        info['extensionManifestVersion'] = manifest.get('manifest_version')
    output.mkdir(parents=True, exist_ok=True, mode=0o700)
    image_dir = output / 'legacy-images'
    image_dir.mkdir(mode=0o700)
    for name, image in images.items():
        target = image_dir / name
        target.write_bytes(image)
        target.chmod(0o600)
    for name, data in [('seed.json', {'tiles': tiles}), ('provenance.json', info)]:
        target = output / name
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        target.chmod(0o600)
    return {'tileCount': len(tiles), 'imageCount': len(images)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--html', type=Path, required=True, help='Local archived Speed Dial HTML file')
    parser.add_argument('--output', type=Path, required=True, help='New or empty private output directory')
    parser.add_argument('--encoding', default='windows-1252', help='Input HTML character encoding')
    parser.add_argument('--source-url', help='Optional provenance metadata; never fetched')
    parser.add_argument('--manifest', type=Path, help='Optional local extension manifest')
    parser.add_argument('--expected-count', type=int, help='Optional exact tile-count check')
    args = parser.parse_args()
    try:
        result = extract(args.html, args.output, args.encoding, args.source_url, args.manifest, args.expected_count)
    except (ValueError, OSError, KeyError, LookupError):
        parser.exit(1, 'Extraction failed. Check the input format, image paths, encoding, and empty output directory.\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
