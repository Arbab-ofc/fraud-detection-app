from __future__ import annotations

import argparse
import csv
import os
from typing import List, Tuple

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [f"V{i}" for i in range(1, 29)] + ["Amount"]
TARGET_COLUMN = "Class"


def load_dataset(path: str) -> Tuple[np.ndarray, np.ndarray]:
    features: List[List[float]] = []
    labels: List[int] = []

    with open(path, "r", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        missing_cols = [
            col for col in FEATURE_COLUMNS + [TARGET_COLUMN] if col not in reader.fieldnames
        ]
        if missing_cols:
            raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")

        for row in reader:
            try:
                features.append([float(row[col]) for col in FEATURE_COLUMNS])
                labels.append(int(float(row[TARGET_COLUMN])))
            except ValueError:
                continue

    if not features:
        raise ValueError("No valid rows found in dataset.")

    return np.array(features, dtype=float), np.array(labels, dtype=int)


def train_pipeline(X: np.ndarray, y: np.ndarray) -> Pipeline:
    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    solver="lbfgs",
                ),
            ),
        ]
    )
    pipeline.fit(X_train, y_train)
    return pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Train fraud detection pipeline.")
    parser.add_argument(
        "--data",
        required=True,
        help="Path to creditcard.csv (Kaggle dataset).",
    )
    parser.add_argument(
        "--output",
        default=os.path.join("model", "fraud_pipeline.joblib"),
        help="Output path for the trained pipeline.",
    )
    args = parser.parse_args()

    X, y = load_dataset(args.data)
    pipeline = train_pipeline(X, y)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    joblib.dump(pipeline, args.output)
    print(f"Saved model pipeline to {args.output}")


if __name__ == "__main__":
    main()
