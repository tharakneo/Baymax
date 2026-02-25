# API Reference

Base URL: `http://localhost:8000/api`

---

## Talk to Me — `/api/chat`

### POST `/api/chat/`
Send a health question and receive a BayMax-style response.

**Request:**
```json
{ "message": "What are symptoms of dehydration?", "session_id": "optional-id" }
```

**Response:**
```json
{ "reply": "...", "sources": ["source1.pdf"], "session_id": "abc123" }
```

### GET `/api/chat/history/{session_id}`
Retrieve chat history for a session.

---

## Scan Me — `/api/scan`

### POST `/api/scan/skin`
Upload a skin image for condition analysis.

**Request:** `multipart/form-data` with `image` field.

**Response:**
```json
{ "label": "Eczema", "confidence": 0.87, "description": "...", "recommendations": ["..."] }
```

### POST `/api/scan/nutrition`
Upload a food image for nutritional analysis. Same format as skin.

---

## Track Me — `/api/track`

### POST `/api/track/log`
Log a health data point.

**Request:**
```json
{ "metric": "heart_rate", "value": 72.0, "unit": "bpm", "timestamp": "2024-01-15T10:30:00" }
```

### GET `/api/track/trends/{metric}`
Get trend analysis and anomaly detection for a metric.

**Response:**
```json
{ "metric": "heart_rate", "data_points": 30, "trend": "stable", "anomalies": [] }
```

### GET `/api/track/summary`
Get overall health summary.

---

## Check Me — `/api/check`

### GET `/api/check/questions/{assessment_type}`
Get assessment questions. Types: `wellness`, `stress`, `sleep`, `mood`.

### POST `/api/check/submit`
Submit assessment answers.

**Request:**
```json
{ "assessment_type": "wellness", "answers": [{ "question_id": 1, "answer": 4 }] }
```

**Response:**
```json
{ "assessment_type": "wellness", "score": 18, "max_score": 25, "interpretation": "...", "recommendations": ["..."] }
```

---

## Utility

### GET `/`
Root endpoint — returns greeting.

### GET `/health`
Health check — returns `{ "status": "healthy" }`.
