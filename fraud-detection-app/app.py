from __future__ import annotations

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import joblib
import math
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "fraud_pipeline.joblib")

try:
    pipeline = joblib.load(MODEL_PATH)
except Exception as exc:  # pragma: no cover - safe fail for startup visibility
    pipeline = None
    app.logger.error("Failed to load model pipeline: %s", exc)

REQUIRED_FIELDS = [f"V{i}" for i in range(1, 29)] + ["Amount"]
OPTIONAL_FIELDS = ["Time"]


def _is_valid_number(value: object) -> bool:
    if isinstance(value, bool):
        return False
    try:
        number = float(value)
    except (TypeError, ValueError):
        return False
    return not math.isnan(number)


def _validate_payload(payload: dict) -> tuple[bool, str | None]:
    missing = [field for field in REQUIRED_FIELDS if field not in payload]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"

    for field in REQUIRED_FIELDS + OPTIONAL_FIELDS:
        if field in payload and not _is_valid_number(payload[field]):
            return False, f"Invalid numeric value for {field}"

    return True, None


def _build_feature_array(payload: dict) -> np.ndarray:
    ordered = REQUIRED_FIELDS
    features = [float(payload[field]) for field in ordered]
    return np.array(features, dtype=float).reshape(1, -1)


def _risk_level(probability: float) -> str:
    if probability < 0.30:
        return "LOW"
    if probability < 0.70:
        return "MEDIUM"
    return "HIGH"


@app.route("/", methods=["GET"])
def index() -> str:
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if pipeline is None:
        return jsonify({"error": "Model pipeline not loaded."}), 500

    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON payload."}), 400

    if not isinstance(payload, dict):
        return jsonify({"error": "JSON payload must be an object."}), 400

    is_valid, error_message = _validate_payload(payload)
    if not is_valid:
        return jsonify({"error": error_message}), 400

    try:
        features = _build_feature_array(payload)
        proba = float(pipeline.predict_proba(features)[0][1])
        label = 1 if proba >= 0.5 else 0
        response = {
            "fraud_probability": proba,
            "label": label,
            "risk_level": _risk_level(proba),
        }
        return jsonify(response)
    except Exception as exc:
        app.logger.error("Prediction failed: %s", exc)
        return jsonify({"error": "Prediction failed. Please try again."}), 500


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
