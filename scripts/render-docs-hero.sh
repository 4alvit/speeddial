#!/usr/bin/env bash
# Project the captured interface without redrawing any UI elements.
set -euo pipefail
repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source_image="$repo_root/docs/images/speedial-local.jpg"
output_image="$repo_root/docs/images/speedial-hero.png"
if ! command -v magick >/dev/null 2>&1; then
  printf '%s\n' 'ImageMagick 7 is required (the magick command).' >&2
  exit 1
fi
if [[ "$(magick identify -format '%wx%h' "$source_image")" != '1440x810' ]]; then
  printf '%s\n' 'Screenshot dimensions changed; review the perspective first.' >&2
  exit 1
fi
render_dir="$(mktemp -d "${TMPDIR:-/tmp}/speedial-hero.XXXXXX")"
trap 'rm -rf -- "$render_dir"' EXIT
magick "$source_image" -alpha on \
  \( -size 1440x810 xc:none -fill white \
     -draw 'roundrectangle 0,0 1439,809 20,20' \) \
  -compose DstIn -composite -compose Over \
  -virtual-pixel transparent -filter Robidoux \
  -define distort:viewport=1600x1040+0+0 \
  -distort Perspective \
  '0,0 100,190 1439,0 1420,70 1439,809 1485,820 0,809 155,960' \
  -strip "$render_dir/panel.png"
magick "$render_dir/panel.png" -fill '#152033' -colorize 100 \
  -channel A -evaluate multiply 0.22 +channel -blur 0x18 \
  -strip "$render_dir/shadow.png"
magick -size 1600x1040 xc:'#f0f1f3' \
  "$render_dir/shadow.png" -geometry +0+18 -compose Over -composite \
  "$render_dir/panel.png" -geometry +0+0 -compose Over -composite \
  -strip -define png:exclude-chunk=date,time "PNG24:$render_dir/hero.png"
mv -- "$render_dir/hero.png" "$output_image"
printf 'Rendered %s\n' "$output_image"
