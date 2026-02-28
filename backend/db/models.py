from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)   # kg
    height = Column(Float, nullable=True)   # cm
    gender = Column(String, nullable=True)  # male, female, other
    calorie_goal = Column(Integer, nullable=True)  # daily calorie goal
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversations = relationship("Conversation", back_populates="user")
    health_logs = relationship("HealthLog", back_populates="user")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)       # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class HealthLog(Base):
    __tablename__ = "health_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_type = Column(String, nullable=False)   # mood, sleep, water, symptom, etc.
    value = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="health_logs")
