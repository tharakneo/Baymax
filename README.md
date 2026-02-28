# 🏥 BayMax AI

Your personal AI powered healthcare companion - inspired by the beloved Disney character.

## ✅ Module 1: Talk to Me

A conversational health Q&A chatbot powered by **RAG** (Retrieval-Augmented Generation).

### Features
- **Context Engine** — automatically pulls historical health logs and inserts them into chat prompts contextually to personalize Baymax's answers.
- **RAG pipeline** — ChromaDB vector store + HuggingFace embeddings + Groq/Llama 3.1 LLM
- **Conversation memory** — multi-turn context via PostgreSQL or in-memory fallback
- **Chat interface** — clean aesthetic with Outfit font, centered greeting, pill input bar
- **Word-by-word streaming** — responses appear with a typewriter effect and blinking cursor
- **Interactive pain scale** — when Baymax asks "rate your pain," a 1–10 visual scale appears inline (green → red)
- **Intro video** — full-screen autoplay with mute toggle, transitions to the main UI

## 📱 Modules

| Module | Description | Status |
|--------|-------------|--------|
| **Talk to Me** | Health Q&A powered by RAG and Context Injection | ✅ Live |
| **Scan Me** | Computer vision image analysis for skin and nutrition | ✅ Live |
| **Track Me** | Complete health logging dashboard for water, sleep, calories, and steps | ✅ Live |
| **Check Me** | Wellness and mental health assessments with weekly proactive insights | 🔜 Coming Soon |

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

