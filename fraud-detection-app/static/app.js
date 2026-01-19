const submitBtn = document.getElementById("submit-btn");
const sampleBtn = document.getElementById("sample-btn");
const clearBtn = document.getElementById("clear-btn");
const loadingIndicator = document.getElementById("loading");
const jsonInput = document.getElementById("json-input");
const errorAlert = document.getElementById("error-alert");
const errorMessage = document.getElementById("error-message");
const placeholder = document.getElementById("placeholder");
const results = document.getElementById("results");
const riskBadge = document.getElementById("risk-badge");
const probabilityText = document.getElementById("probability");

const manualFields = ["Amount"];
const manualInputs = manualFields.reduce((acc, field) => {
  acc[field] = document.getElementById(`field-${field}`);
  return acc;
}, {});

let chartInstance = null;

const sampleData = {
  V1: -1.359807,
  V2: -0.072781,
  V3: 2.536346,
  V4: 1.378155,
  V5: -0.338321,
  V6: 0.462388,
  V7: 0.239599,
  V8: 0.098698,
  V9: 0.363787,
  V10: 0.090794,
  V11: -0.5516,
  V12: -0.617801,
  V13: -0.99139,
  V14: -0.311169,
  V15: 1.468177,
  V16: -0.470401,
  V17: 0.207971,
  V18: 0.025791,
  V19: 0.403993,
  V20: 0.251412,
  V21: -0.018307,
  V22: 0.277838,
  V23: -0.110474,
  V24: 0.066928,
  V25: 0.128539,
  V26: -0.189115,
  V27: 0.133558,
  V28: -0.021053,
  Amount: 149.62,
};
const defaultFeaturePayload = Object.fromEntries(
  Object.entries(sampleData).filter(([key]) => key !== "Amount"),
);

function switchInputMode(mode) {
  clearError();
}

function fillSampleData() {
  const randomAmount = Number((Math.random() * 490 + 10).toFixed(2));
  manualFields.forEach((field) => {
    const value = field === "Amount" ? randomAmount : sampleData[field];
    manualInputs[field].value = value ?? "";
  });
  clearError();
}

function clearForm() {
  manualFields.forEach((field) => {
    manualInputs[field].value = "";
  });
  if (jsonInput) {
    jsonInput.value = "";
  }
  placeholder.classList.remove("hidden");
  results.classList.add("hidden");
  clearError();
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

function validateInput() {
  if (jsonInput && jsonInput.value.trim()) {
    try {
      const payload = JSON.parse(jsonInput.value);
      if (typeof payload !== "object" || Array.isArray(payload) || payload === null) {
        return { valid: false, error: "JSON payload must be an object." };
      }
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: "Invalid JSON format." };
    }
  }

  const payload = {};
  let hasValue = false;
  for (const field of manualFields) {
    const value = manualInputs[field].value.trim();
    if (value) {
      hasValue = true;
    }
    if (!value || Number.isNaN(Number(value))) {
      return { valid: false, error: `Please enter a numeric value for ${field}.` };
    }
    payload[field] = Number(value);
  }

  if (!hasValue) {
    return { valid: false, error: "Please enter a transaction amount." };
  }

  return {
    valid: true,
    payload: {
      ...defaultFeaturePayload,
      Amount: payload.Amount,
    },
  };
}

async function submitPrediction() {
  clearError();
  const validation = validateInput();
  if (!validation.valid) {
    displayError(validation.error);
    return;
  }

  setLoading(true);
  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation.payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Prediction failed.");
    }

    displayResults(data);
  } catch (error) {
    displayError(error.message || "Network error.");
  } finally {
    setLoading(false);
  }
}

async function submitPredictionPayload(payload) {
  setLoading(true);
  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Prediction failed.");
    }

    displayResults(data);
  } catch (error) {
    displayError(error.message || "Network error.");
  } finally {
    setLoading(false);
  }
}

function displayResults(data) {
  placeholder.classList.add("hidden");
  results.classList.remove("hidden");

  const probability = Math.max(0, Math.min(1, Number(data.fraud_probability)));
  const percentage = (probability * 100).toFixed(1);
  probabilityText.textContent = `${percentage}%`;

  riskBadge.textContent = data.risk_level || "LOW";
  riskBadge.classList.remove("badge-success", "badge-warning", "badge-error");
  if (data.risk_level === "HIGH") {
    riskBadge.classList.add("badge-error");
  } else if (data.risk_level === "MEDIUM") {
    riskBadge.classList.add("badge-warning");
  } else {
    riskBadge.classList.add("badge-success");
  }

  updateChart(probability);
}

function displayError(message) {
  errorMessage.textContent = message;
  errorAlert.classList.remove("hidden");
}

function clearError() {
  errorAlert.classList.add("hidden");
  errorMessage.textContent = "";
}

function updateChart(fraudProb) {
  const ctx = document.getElementById("risk-chart");
  const legitProb = Math.max(0, 1 - fraudProb);

  const data = {
    labels: ["Fraud", "Legitimate"],
    datasets: [
      {
        data: [fraudProb, legitProb],
        backgroundColor: ["#ef4444", "#10b981"],
        borderWidth: 0,
      },
    ],
  };

  if (chartInstance) {
    chartInstance.data = data;
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data,
    options: {
      responsive: true,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = (context.parsed * 100).toFixed(1);
              return `${context.label}: ${value}%`;
            },
          },
        },
      },
    },
  });
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  sampleBtn.disabled = isLoading;
  clearBtn.disabled = isLoading;
  loadingIndicator.classList.toggle("hidden", !isLoading);
}

submitBtn.addEventListener("click", submitPrediction);
sampleBtn.addEventListener("click", fillSampleData);
clearBtn.addEventListener("click", clearForm);

switchInputMode("manual");
