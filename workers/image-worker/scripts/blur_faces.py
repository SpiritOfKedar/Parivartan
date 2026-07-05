#!/usr/bin/env python3
import sys

import cv2
import numpy as np

BLUR_PRESETS = {
    "light": 21,
    "medium": 41,
    "strong": 61,
}


def blur_region(image: np.ndarray, x: int, y: int, w: int, h: int, radius: int) -> None:
    height, width = image.shape[:2]
    x1 = max(0, x)
    y1 = max(0, y)
    x2 = min(width, x + w)
    y2 = min(height, y + h)
    if x2 <= x1 or y2 <= y1:
        return

    region = image[y1:y2, x1:x2]
    kernel = radius if radius % 2 == 1 else radius + 1
    blurred = cv2.GaussianBlur(region, (kernel, kernel), 0)
    image[y1:y2, x1:x2] = blurred


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit(
            "Usage: blur_faces.py <input> <output> [light|medium|strong]"
        )

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    strength = sys.argv[3] if len(sys.argv) > 3 else "medium"
    radius = BLUR_PRESETS.get(strength, BLUR_PRESETS["medium"])

    image = cv2.imread(input_path)
    if image is None:
        raise SystemExit(f"Could not read image: {input_path}")

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        raise SystemExit("Could not load face detection model.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    for (x, y, w, h) in faces:
        padding = int(max(w, h) * 0.15)
        blur_region(
            image,
            x - padding,
            y - padding,
            w + padding * 2,
            h + padding * 2,
            radius,
        )

    if not cv2.imwrite(output_path, image):
        raise SystemExit(f"Could not write output: {output_path}")


if __name__ == "__main__":
    main()
