"""SQLAlchemy database models."""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat_sessions = relationship("ChatSession", back_populates="user")
    health_records = relationship("HealthRecord", back_populates="user")
    assessments = relationship("Assessment", back_populates="user")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="health_records")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    assessment_type = Column(String(50), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")
