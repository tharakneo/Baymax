# 🏥 BayMax AI

Your personal AI-powered healthcare companion — inspired by the beloved Disney character.

## Modules

| Module | Description |
|--------|-------------|
| **Talk to Me** | Health Q&A powered by RAG (Retrieval-Augmented Generation) |
| **Scan Me** | Skin condition & nutrition image analysis using computer vision |
| **Track Me** | Health trends & anomaly detection over time |
| **Check Me** | Wellness & mental health self-assessments |

## Tech Stack

- **Backend:** FastAPI · Python 3.11+
- **Frontend:** React (Vite) · JSX
- **Database:** PostgreSQL + ChromaDB (vector store)
- **ML/AI:** PyTorch · HuggingFace Transformers · LangChain
- **Infrastructure:** Docker Compose

## Quick Start

```bash
# 1. Clone & configure
cp .env.example .env
# Edit .env with your API keys

# 2. Run everything
docker-compose up --build

# 3. Open
# Frontend → http://localhost:5173
# API docs → http://localhost:8000/docs
```

## Project Structure

```
baymax-ai/
├── backend/          # FastAPI application
│   ├── api/          # Route handlers & middleware
│   ├── core/         # RAG, CV, anomaly detection engines
│   ├── db/           # Database models & connections
│   └── ml/           # Training scripts & saved models
├── frontend/         # React application
│   └── src/
├── notebooks/        # Jupyter notebooks for EDA & experiments
├── data/             # Raw & processed datasets
└── docs/             # Architecture & API documentation
```

## License

MIT
