#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ALBUMS_DIR="$PROJECT_ROOT/src/albums"
ROW_DIR="$PROJECT_ROOT/src/row"
THUMBS_DIR="$PROJECT_ROOT/src/thumbs"
ALBUM_FILTER="${1:-}"
MAX_BYTES=500000
THUMB_MAX_BYTES=120000

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp not found. Install with: brew install webp"
  exit 1
fi

if [[ ! -d "$ALBUMS_DIR" ]]; then
  echo "Missing albums directory: $ALBUMS_DIR"
  exit 1
fi

if [[ -n "$ALBUM_FILTER" ]]; then
  ALBUM_FILTER="${ALBUM_FILTER#/}"
  ALBUM_FILTER="${ALBUM_FILTER%/}"
  if [[ "$ALBUM_FILTER" == *".."* ]]; then
    echo "Invalid album filter."
    exit 1
  fi
  if [[ ! -d "$ALBUMS_DIR/$ALBUM_FILTER" ]]; then
    echo "Album folder not found: $ALBUM_FILTER"
    exit 1
  fi
fi

FIND_ROOT="$ALBUMS_DIR"
if [[ -n "$ALBUM_FILTER" ]]; then
  FIND_ROOT="$ALBUMS_DIR/$ALBUM_FILTER"
fi

mkdir -p "$ROW_DIR"
mkdir -p "$THUMBS_DIR"
cd "$PROJECT_ROOT"

source_exists_for_generated() {
  local generated="$1"
  local rel_dir base src_dir
  rel_dir="$(dirname "${generated#"$2/"}")"
  base="$(basename "$generated" .webp)"
  src_dir="$ALBUMS_DIR/$rel_dir"

  if [[ ! -d "$src_dir" ]]; then
    return 1
  fi

  for ext in jpg JPG jpeg JPEG png PNG; do
    if [[ -f "$src_dir/$base.$ext" ]]; then
      return 0
    fi
  done

  return 1
}

cleanup_orphans_in_dir() {
  local target_dir="$1"
  local removed=0

  if [[ ! -d "$target_dir" ]]; then
    echo 0
    return
  fi

  while IFS= read -r -d '' file; do
    if source_exists_for_generated "$file" "$target_dir"; then
      continue
    fi
    rm -f "$file"
    removed=$((removed + 1))
    printf "REMOVE %s (orphan)\n" "$file" >&2
  done < <(find "$target_dir" -type f -name "*.webp" -print0)

  # Remove leftover empty folders.
  find "$target_dir" -type d -empty -delete
  echo "$removed"
}

needs_convert() {
  local src="$1"
  local rel_dir out_dir thumb_dir base out thumb_out
  rel_dir="$(dirname "${src#"$ALBUMS_DIR/"}")"
  out_dir="$ROW_DIR/$rel_dir"
  thumb_dir="$THUMBS_DIR/$rel_dir"
  base="$(basename "$src")"
  base="${base%.*}"
  out="$out_dir/$base.webp"
  thumb_out="$thumb_dir/$base.webp"

  # Convert when output is missing.
  if [[ ! -f "$out" || ! -f "$thumb_out" ]]; then
    return 0
  fi

  # Convert when source is newer than any output.
  if [[ "$src" -nt "$out" || "$src" -nt "$thumb_out" ]]; then
    return 0
  fi

  return 1
}

convert_one() {
  local src="$1"
  local rel_dir out_dir base out tmp size thumb_dir thumb_out thumb_tmp thumb_size tmp_suffix
  local src_rel out_rel thumb_rel
  src_rel="${src#"$PROJECT_ROOT/"}"
  rel_dir="$(dirname "${src#"$ALBUMS_DIR/"}")"
  out_dir="$ROW_DIR/$rel_dir"
  thumb_dir="$THUMBS_DIR/$rel_dir"
  base="$(basename "$src")"
  base="${base%.*}"
  mkdir -p "$out_dir"
  mkdir -p "$thumb_dir"
  out="$out_dir/$base.webp"
  thumb_out="$thumb_dir/$base.webp"
  out_rel="${out#"$PROJECT_ROOT/"}"
  thumb_rel="${thumb_out#"$PROJECT_ROOT/"}"
  tmp_suffix=".tmp.$$.${RANDOM}"
  tmp="${out}${tmp_suffix}"
  thumb_tmp="${thumb_out}${tmp_suffix}"

  # Start with a quality that usually keeps visual quality while reducing strongly.
  if [[ ! -r "$src" || ! -s "$src" ]]; then
    printf "WARN skip unreadable image: %s\n" "$src_rel" >&2
    return 1
  fi

  if ! cwebp -quiet -mt -m 6 -q 76 "$src_rel" -o "$tmp"; then
    rm -f "$tmp" "$thumb_tmp"
    printf "WARN convert failed (pass1): %s\n" "$src_rel" >&2
    return 1
  fi
  if [[ ! -f "$tmp" ]]; then
    rm -f "$tmp" "$thumb_tmp"
      printf "WARN missing temp row output: %s\n" "$src_rel" >&2
      return 1
  fi
  size=$(wc -c < "$tmp" | tr -d '[:space:]')

  if [[ "$size" -gt "$MAX_BYTES" ]]; then
    # Ask encoder to target <= 500KB.
    if ! cwebp -quiet -mt -m 6 -pass 6 -q 70 -size "$MAX_BYTES" "$src_rel" -o "$tmp"; then
      rm -f "$tmp" "$thumb_tmp"
      printf "WARN convert failed (pass2): %s\n" "$src_rel" >&2
      return 1
    fi
    if [[ ! -f "$tmp" ]]; then
      rm -f "$tmp" "$thumb_tmp"
      printf "WARN missing temp row output after pass2: %s\n" "$src_rel" >&2
      return 1
    fi
    size=$(wc -c < "$tmp" | tr -d '[:space:]')
  fi

  if [[ "$size" -gt "$MAX_BYTES" ]]; then
    # Fallback: reduce resolution for hard cases.
    if ! cwebp -quiet -mt -m 6 -pass 6 -q 60 -size "$MAX_BYTES" -resize 1920 0 "$src_rel" -o "$tmp"; then
      rm -f "$tmp" "$thumb_tmp"
      printf "WARN convert failed (pass3): %s\n" "$src_rel" >&2
      return 1
    fi
    if [[ ! -f "$tmp" ]]; then
      rm -f "$tmp" "$thumb_tmp"
      printf "WARN missing temp row output after pass3: %s\n" "$src_rel" >&2
      return 1
    fi
    size=$(wc -c < "$tmp" | tr -d '[:space:]')
  fi

  if ! mv -f "$tmp" "$out"; then
    rm -f "$tmp" "$thumb_tmp"
    printf "WARN cannot move row output: %s\n" "$src_rel" >&2
    return 1
  fi

  # Lightweight thumbnail for list pages.
  if ! cwebp -quiet -mt -m 6 -q 64 -resize 900 0 "$src_rel" -o "$thumb_tmp"; then
    rm -f "$thumb_tmp"
    printf "WARN thumb convert failed (pass1): %s\n" "$src_rel" >&2
    return 1
  fi
  if [[ ! -f "$thumb_tmp" ]]; then
    rm -f "$thumb_tmp"
    printf "WARN missing temp thumb output: %s\n" "$src_rel" >&2
    return 1
  fi
  thumb_size=$(wc -c < "$thumb_tmp" | tr -d '[:space:]')
  if [[ "$thumb_size" -gt "$THUMB_MAX_BYTES" ]]; then
    if ! cwebp -quiet -mt -m 6 -pass 6 -q 58 -size "$THUMB_MAX_BYTES" -resize 760 0 "$src_rel" -o "$thumb_tmp"; then
      rm -f "$thumb_tmp"
      printf "WARN thumb convert failed (pass2): %s\n" "$src_rel" >&2
      return 1
    fi
    if [[ ! -f "$thumb_tmp" ]]; then
      rm -f "$thumb_tmp"
      printf "WARN missing temp thumb output after pass2: %s\n" "$src_rel" >&2
      return 1
    fi
    thumb_size=$(wc -c < "$thumb_tmp" | tr -d '[:space:]')
  fi
  if [[ "$thumb_size" -gt "$THUMB_MAX_BYTES" ]]; then
    if ! cwebp -quiet -mt -m 6 -pass 6 -q 52 -size "$THUMB_MAX_BYTES" -resize 640 0 "$src_rel" -o "$thumb_tmp"; then
      rm -f "$thumb_tmp"
      printf "WARN thumb convert failed (pass3): %s\n" "$src_rel" >&2
      return 1
    fi
    if [[ ! -f "$thumb_tmp" ]]; then
      rm -f "$thumb_tmp"
      printf "WARN missing temp thumb output after pass3: %s\n" "$src_rel" >&2
      return 1
    fi
    thumb_size=$(wc -c < "$thumb_tmp" | tr -d '[:space:]')
  fi
  if ! mv -f "$thumb_tmp" "$thumb_out"; then
    rm -f "$thumb_tmp"
    printf "WARN cannot move thumb output: %s\n" "$src_rel" >&2
    return 1
  fi

  printf "%s -> row:%s (%s bytes), thumb:%s (%s bytes)\n" "$src_rel" "$out_rel" "$size" "$thumb_rel" "$thumb_size"
}

export -f convert_one
export -f needs_convert
export MAX_BYTES
export THUMB_MAX_BYTES

converted=0
skipped=0
removed_row=0
removed_thumbs=0
failed=0

while IFS= read -r -d '' file; do
    if ! needs_convert "$file"; then
      skipped=$((skipped + 1))
      printf "SKIP %s (up-to-date)\n" "${file#"$PROJECT_ROOT/"}"
      continue
    fi
    if convert_one "$file"; then
      converted=$((converted + 1))
    else
      failed=$((failed + 1))
    fi
done < <(
  find "$FIND_ROOT" -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) \
    -print0
)

if [[ -z "$ALBUM_FILTER" ]]; then
  removed_row="$(cleanup_orphans_in_dir "$ROW_DIR")"
  removed_thumbs="$(cleanup_orphans_in_dir "$THUMBS_DIR")"
else
  removed_row=0
  removed_thumbs=0
fi

echo "Done: generated .webp files in src/row and src/thumbs"
echo "Converted: $converted | Skipped: $skipped | Failed: $failed | Removed row: $removed_row | Removed thumbs: $removed_thumbs"
exit 0
