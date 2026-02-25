"""RAG Engine — Retrieval-Augmented Generation pipeline for health Q&A."""

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Chroma

from config import settings
from core.baymax_persona import SYSTEM_PROMPT


class RAGEngine:
    """Health knowledge retrieval & answer generation."""

    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.openai_api_key,
        )
        self.vectorstore = Chroma(
            persist_directory=settings.chroma_persist_dir,
            embedding_function=self.embeddings,
        )
        self.llm = ChatOpenAI(
            model=settings.llm_model,
            openai_api_key=settings.openai_api_key,
            temperature=0.3,
        )
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 5}),
            return_source_documents=True,
        )

    async def ask(self, question: str) -> dict:
        """Ask a health question and receive a sourced answer."""
        result = self.qa_chain.invoke({"query": question})
        sources = [doc.metadata.get("source", "") for doc in result.get("source_documents", [])]
        return {
            "answer": result["result"],
            "sources": list(set(sources)),
        }

    def add_documents(self, texts: list[str], metadatas: list[dict] = None):
        """Ingest documents into the vector store."""
        self.vectorstore.add_texts(texts=texts, metadatas=metadatas)
