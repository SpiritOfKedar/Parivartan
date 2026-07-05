#!/usr/bin/env python3
import sys
from rembg import remove
from PIL import Image

def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: remove_background.py <input> <output>")

    input_path, output_path = sys.argv[1], sys.argv[2]
    with open(input_path, "rb") as handle:
        input_bytes = handle.read()

    output_bytes = remove(input_bytes)
    with open(output_path, "wb") as handle:
        handle.write(output_bytes)

    with Image.open(output_path) as image:
        image.save(output_path, format="PNG")

if __name__ == "__main__":
    main()
