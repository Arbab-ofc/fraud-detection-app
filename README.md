# Credit Card Fraud Detection (Flask)

Production-ready Flask web application for scoring credit card transactions using the Kaggle Credit Card Fraud Detection dataset (`mlg-ulb/creditcardfraud`). The app exposes a `/predict` API and a responsive UI for manual Amount input or full JSON payloads.

Live demo: https://fraud-detection-app-uo6n.onrender.com/

GitHub: https://github.com/Arbab-ofc/fraud-detection-app

[![Live Demo](https://img.shields.io/badge/Live-Demo-00C853?style=for-the-badge&logo=render&logoColor=white)](https://fraud-detection-app-uo6n.onrender.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Arbab-ofc/fraud-detection-app)

## Features

- Flask backend with JSON prediction API
- Scikit-learn pipeline (`joblib`) loaded at startup
- CORS enabled for API access
- Input validation (missing fields, non-numeric values, NaN)
- Risk-level classification (LOW / MEDIUM / HIGH)
- Responsive frontend with Tailwind CSS + DaisyUI
- Donut chart visualization via Chart.js
- Sample data generator with random Amount

## Project Structure

```
fraud-detection-app/
├── app.py
├── train_model.py
├── model/
│   └── fraud_pipeline.joblib
├── templates/
│   └── index.html
├── static/
│   └── app.js
├── requirements.txt
└── README.md
```

## Tech Stack

![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![joblib](https://img.shields.io/badge/joblib-4B5563?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

- Backend: Flask, scikit-learn, joblib
- Frontend: Tailwind CSS (CDN), DaisyUI (CDN), Chart.js (CDN)

## Setup

### 1) Create virtual environment

```bash
python -m venv .venv
. .venv/bin/activate
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

## Dataset

This app is designed for the Kaggle Credit Card Fraud Detection dataset:

- `V1`–`V28`: PCA-transformed numerical features (anonymized)
- `Amount`: transaction amount (interpretable)
- `Time`: seconds elapsed (optional)
- `Class`: fraud label (0 = legitimate, 1 = fraud)

## Model Training

A training script is included to create the pipeline file expected by the app.

### Option A: Download via kagglehub

```bash
. .venv/bin/activate
pip install kagglehub
python - <<'PY'
import kagglehub
path = kagglehub.dataset_download("mlg-ulb/creditcardfraud")
print(path)
PY
```

This prints a path containing `creditcard.csv`.

### Option B: Manual download

Download `creditcard.csv` from Kaggle and note its local path.

### Train the model

```bash
. .venv/bin/activate
python train_model.py --data /path/to/creditcard.csv --output model/fraud_pipeline.joblib
```

The output file must be located at:

```
fraud-detection-app/model/fraud_pipeline.joblib
```

## Run the App

```bash
. .venv/bin/activate
python app.py
```

Open:

- http://127.0.0.1:5000

## Run with Gunicorn (Production)

Install Gunicorn:

```bash
. .venv/bin/activate
pip install gunicorn
```

Start the server:

```bash
. .venv/bin/activate
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

Notes:
- Adjust `-w` (workers) based on CPU cores.
- Use a process manager (systemd, supervisor, or Docker) for production deployments.

## Deploy on Render

1) Push this repository to GitHub.
2) In Render, create a **New Web Service** and connect the repo.
3) Set the following:
   - Build Command: `pip install -r requirements.txt && pip install gunicorn`
   - Start Command: `gunicorn -w 2 -b 0.0.0.0:$PORT app:app`
4) Add the model file:
   - Upload `model/fraud_pipeline.joblib` to the repo, or
   - Use a Render Disk and point your app to its path.

Notes:
- Render sets `$PORT` automatically. Do not hardcode the port.
- For larger models, store the file in a persistent disk or object storage.

## API Usage

### POST `/predict`

**Required JSON fields**:
- `V1` ... `V28` (floats)
- `Amount` (float)

**Optional**:
- `Time` (float)

Example request:

```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"V1": -1.36, "V2": -0.07, "V3": 2.53, "V4": 1.37, "V5": -0.33,
       "V6": 0.46, "V7": 0.23, "V8": 0.09, "V9": 0.36, "V10": 0.09,
       "V11": -0.55, "V12": -0.61, "V13": -0.99, "V14": -0.31, "V15": 1.46,
       "V16": -0.47, "V17": 0.20, "V18": 0.02, "V19": 0.40, "V20": 0.25,
       "V21": -0.01, "V22": 0.27, "V23": -0.11, "V24": 0.06, "V25": 0.12,
       "V26": -0.18, "V27": 0.13, "V28": -0.02, "Amount": 149.62}'
```

Example response:

```json
{
  "fraud_probability": 0.735,
  "label": 1,
  "risk_level": "HIGH"
}
```

### Validation Errors

Missing fields:
```json
{ "error": "Missing fields: V3, V5" }
```

Invalid values:
```json
{ "error": "Invalid numeric value for V12" }
```

## UI Usage

- **Amount**: Provide a numeric transaction amount.
- **Paste JSON**: Paste full payload to override all fields.
- **Use Sample Data**: Fills baseline values and a random Amount.
- **Analyze Transaction**: Sends request to `/predict` and updates results.

## Risk Levels

- `LOW` if probability < 0.30
- `MEDIUM` if probability < 0.70
- `HIGH` if probability >= 0.70

## Troubleshooting

- **Model pipeline not loaded**: Ensure `model/fraud_pipeline.joblib` exists.
- **Missing fields**: The API requires all `V1`–`V28` and `Amount`.
- **Network errors**: Confirm Flask server is running and reachable.

## Security Notes

This app is a demo and uses the Flask development server by default. Use a production WSGI server (e.g., Gunicorn) for deployment.
