#!/usr/bin/env python3
import sys

import cv2
import numpy as np

MODELS = {
    2: ("EDSR_x2.pb", "edsr", 2),
    4: ("EDSR_x4.pb", "edsr", 4),
}

MODEL_BASE_URL = (
    "https://github.com/Saafke/EDSR_Tensorflow/raw/master/models/"
)


def download_model(model_name: str, destination: str) -> None:
    import urllib.request

    url = MODEL_BASE_URL + model_name
    urllib.request.urlretrieve(url, destination)


def upscale_with_dnn(image: np.ndarray, scale: int, models_dir: str) -> np.ndarray:
    model_name, model_type, model_scale = MODELS[scale]
    model_path = f"{models_dir}/{model_name}"

    import os

    if not os.path.exists(model_path):
        os.makedirs(models_dir, exist_ok=True)
        download_model(model_name, model_path)

    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(model_path)
    sr.setModel(model_type, model_scale)
    return sr.upsample(image)


def upscale_with_lanczos(image: np.ndarray, scale: int) -> np.ndarray:
    height, width = image.shape[:2]
    return cv2.resize(
        image,
        (width * scale, height * scale),
        interpolation=cv2.INTER_LANCZOS4,
    )


def main() -> None:
    if len(sys.argv) < 4:
        raise SystemExit("Usage: upscale.py <input> <output> <2|4> [models_dir]")

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    scale = int(sys.argv[3])
    models_dir = sys.argv[4] if len(sys.argv) > 4 else "/tmp/superres-models"

    if scale not in MODELS:
        raise SystemExit("Scale must be 2 or 4.")

    image = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise SystemExit(f"Could not read image: {input_path}")

    try:
        upscaled = upscale_with_dnn(image, scale, models_dir)
    except Exception:
        upscaled = upscale_with_lanczos(image, scale)

    if not cv2.imwrite(output_path, upscaled):
        raise SystemExit(f"Could not write output: {output_path}")


if __name__ == "__main__":
    main()
