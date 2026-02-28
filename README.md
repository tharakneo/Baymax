# 🏥 BayMax AI

Your personal AI powered healthcare companion - inspired by the beloved Disney character.

A comprehensive, AI-powered healthcare companion built with FastAPI, React, and LangChain. 

Baymax is designed to be your all-in-one personal health assistant, offering three core integrated modules:

## 📱 Core Modules

### 💬 1. Talk to Me (Context-Aware AI Chatbot)
A conversational health Q&A chatbot powered by **RAG** (Retrieval-Augmented Generation) and Llama 3.1.
- **Context Engine** — Baymax actively analyzes your messages for symptoms and automatically fetches your historical logs to generate deeply personalized advice.
- **Strict RAG Constraints** — Designed with strict medical guardrails that prioritize your actual logged health data over generic medical web results.
- **Interactive UI** — Features an interactive 1-10 pain scale and word-by-word streaming for a natural chat experience.

### 📊 2. Track Me (Health logging & Weekly Insights)
A beautiful, glass-morphism dashboard to monitor your daily health metrics.
- **Daily Logging** — Track your Water intake, Sleep hours, Calorie consumption, and Steps.
- **Weekly Insights Engine** — An autonomous job that analyzes your rolling 7-day health data to give you personalized, proactive insights (e.g., warning you about dehydration trends before you feel sick).
- **Apple Watch Sync** — (Mocked) interface for automatic step tracking sync.

### 📷 3. Scan Me (Computer Vision Analysis)
An integrated PyTorch-based image analysis pipeline.
- **Skin Analysis** — Upload photos of rashes, moles, or lesions and receive an AI-powered assessment of potential dermatological conditions.
- **Nutrition Analysis** — (In progress) Upload meal photos to automatically estimate caloric content and nutritional breakdowns.

## Tech Stack

- **Backend:** FastAPI · Python 3.12 · LangChain LCEL
- **LLM:** Groq API · Llama 3.1 8B Instant
- **Embeddings:** HuggingFace `all-MiniLM-L6-v2`
- **Vector Store:** ChromaDB (persistent)
- **Database:** PostgreSQL 16 (Docker)
- **Frontend:** React 18 · Vite 5 · Vanilla CSS
- **Infrastructure:** Docker Compose

## Quick Start

### Prerequisites
- Python 3.12+, Node.js 18+, Docker Desktop

### 1. Clone & configure
```bash
git clone https://github.com/your-username/BayMax.git
cd BayMax
```

### 2. Set up environment
```bash
cp backend/env.example backend/.env
# Edit backend/.env with your Groq API key
```

### 3. Start the database
```bash
docker compose up -d db
```

### 4. Start the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 5. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Open the app
- **Frontend →** [http://localhost:5173](http://localhost:5173)
- **API docs →** [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure

```
BayMax/
├── backend/                # FastAPI application
│   ├── api/routes/         # Chat, scan, track, check endpoints
│   ├── core/               # RAG engine, Baymax persona
│   │   ├── rag_engine.py   # LCEL chain (retriever → prompt → Groq)
│   │   └── baymax_persona.py
│   ├── db/                 # PostgreSQL models, ChromaDB vector store
│   ├── ingest.py           # Document ingestion into ChromaDB
│   └── main.py             # FastAPI app entry point
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── App.jsx         # Video intro → hero card → module page
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx   # ChatGPT-style chat with typewriter
│   │   │   ├── PainScale.jsx    # Interactive 1-10 scale widget
│   │   │   └── IntroVideo.jsx   # Video layer with mute toggle
│   │   └── utils/api.js    # Axios wrapper for backend calls
│   └── index.html
├── docker-compose.yml      # PostgreSQL service
└── intro.mp4               # Intro video asset
```

## License

