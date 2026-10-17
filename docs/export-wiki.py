#!/usr/bin/env python3
"""Export the source wiki for optional GitHub Wiki publication; never publishes."""

import argparse
from pathlib import Path
import re
import shutil
from urllib.parse import quote, urlsplit


def export(destination: Path, ref: str = "main") -> int:
    repository = Path(__file__).resolve().parent.parent
    source = repository / "wiki"
    destination = destination.expanduser().resolve()
    if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
        raise ValueError("Destination must be absent or an empty directory")
    if destination == source or source in destination.parents:
        raise ValueError("Destination must be outside the source wiki")
    destination.mkdir(parents=True, exist_ok=True)
    base = "https://github.com/4alvit/speeddial/blob/" + quote(ref, safe="") + "/"
    pages = 0

    def rewrite(match: re.Match) -> str:
        target = match.group(2)
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.path:
            return match.group(0)
        resolved = (source / parsed.path).resolve()
        suffix = ("?" + parsed.query if parsed.query else "") + ("#" + parsed.fragment if parsed.fragment else "")
        if resolved.parent == source and resolved.suffix == ".md":
            replacement = quote(resolved.stem) + suffix
        elif source in resolved.parents:
            replacement = quote(resolved.relative_to(source).as_posix(), safe="/") + suffix
        elif repository in resolved.parents:
            replacement = base + quote(resolved.relative_to(repository).as_posix(), safe="/") + suffix
        else:
            raise ValueError(f"Local link escapes the repository: {target}")
        return match.group(1) + replacement + match.group(3)

    for item in sorted(source.rglob("*")):
        if item.is_symlink():
            raise ValueError(f"Symlinks are not exported: {item}")
        relative = item.relative_to(source)
        target = destination / relative
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        elif item.suffix == ".md":
            if item.parent != source:
                raise ValueError("Nested wiki pages need explicit link-resolution support")
            text = item.read_text(encoding="utf-8")
            text = re.sub(r"(\]\()([^\s)]+)(\))", rewrite, text)
            target.write_text(text, encoding="utf-8")
            pages += 1
        else:
            shutil.copy2(item, target)
    return pages


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--ref", default="main", help="Source revision used for links outside the wiki")
    args = parser.parse_args()
    try:
        count = export(args.destination, args.ref)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Export failed: {error}\n")
    print(f"Exported {count} pages to {args.destination}; no publication was performed.")
