# Architecture

## Overview

BayMax AI is a modular healthcare companion with four core modules, a shared backend, and a React frontend.

```
┌─────────────────────────────────────────┐
│              React Frontend             │
│  ChatWindow │ ImageUpload │ Dashboard   │
│             │  CheckIn    │ BaymaxAvatar│
└──────────────────┬──────────────────────┘
                   │ REST API (Axios)
┌──────────────────▼──────────────────────┐
│           FastAPI Backend               │
│                                         │
│  /api/chat  → RAG Engine (LangChain)    │
│  /api/scan  → Image Model (PyTorch)     │
│  /api/track → Anomaly Detector (sklearn)│
│  /api/check → Assessment Engine         │
│                                         │
├─────────────────────────────────────────┤
│  PostgreSQL        │    ChromaDB        │
│  (User data,       │    (Vector store,  │
│   health records)  │     RAG knowledge) │
└─────────────────────────────────────────┘
```

## Module Details

### Talk to Me — RAG Pipeline
- **Embeddings:** HuggingFace all-MiniLM-L6-v2
- **Vector Store:** ChromaDB (persisted to disk)
- **LLM:** Groq/Llama 3.1 via LangChain
- **Persona:** BayMax-style system prompt

### Scan Me — Computer Vision
- **Architecture:** ResNet50 (transfer learning)
- **Skin:** Fine-tuned on dermatology datasets
- **Nutrition:** Fine-tuned on food image datasets
- **Inference:** PyTorch with GPU support

### Track Me — Anomaly Detection
- **Algorithm:** Isolation Forest (scikit-learn)
- **Trend Analysis:** Linear regression slope
- **Storage:** PostgreSQL health_records table

### Check Me — Assessments
- **Format:** Likert-scale questionnaires
- **Types:** Wellness, stress, sleep, mood
- **Scoring:** Sum-based with recommendations

## Data Flow

1. User interacts with React frontend
2. Axios sends requests to FastAPI endpoints
3. Backend routes delegate to core engines
4. Results stored in PostgreSQL / ChromaDB
5. Response returned to frontend
