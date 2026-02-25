"""Anomaly Detection — Detect unusual patterns in health metrics."""

import numpy as np
from sklearn.ensemble import IsolationForest


class AnomalyDetector:
    """Detects anomalies in time-series health data."""

    def __init__(self, contamination: float = 0.05):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=200,
        )
        self.is_fitted = False

    def fit(self, data: list[float]):
        """Fit the model on historical health data."""
        X = np.array(data).reshape(-1, 1)
        self.model.fit(X)
        self.is_fitted = True

    def detect(self, data: list[float]) -> list[dict]:
        """Detect anomalies in the given data points."""
        if not self.is_fitted:
            self.fit(data)

        X = np.array(data).reshape(-1, 1)
        predictions = self.model.predict(X)
        scores = self.model.decision_function(X)

        anomalies = []
        for i, (pred, score) in enumerate(zip(predictions, scores)):
            if pred == -1:  # Anomaly
                anomalies.append({
                    "index": i,
                    "value": data[i],
                    "anomaly_score": round(float(score), 4),
                })

        return anomalies

    def get_trend(self, data: list[float]) -> str:
        """Determine the overall trend direction."""
        if len(data) < 2:
            return "insufficient_data"
        slope = np.polyfit(range(len(data)), data, 1)[0]
        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        return "stable"
