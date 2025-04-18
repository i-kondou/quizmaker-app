from .database import Base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, select
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class ImageModel(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    heritages = relationship("HeritageModel", back_populates="image", cascade="all, delete-orphan", passive_deletes=True)

class HeritageModel(Base):
    __tablename__ = "heritages"
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    simple_summary = Column(JSON, nullable=True)
    criteria = Column(JSON, nullable=True)
    unesco_tag = Column(String(255), nullable=True)
    country = Column(JSON, nullable=True)
    region = Column(JSON, nullable=True)
    feature = Column(JSON, nullable=True)
    image = relationship("ImageModel", back_populates="heritages")
    quizzes = relationship("QuizModel", back_populates="heritage", cascade="all, delete-orphan", passive_deletes=True)

class QuizModel(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    answer = Column(Text, nullable=False)
    heritage_id = Column(Integer, ForeignKey("heritages.id", ondelete="CASCADE"), nullable=False, index=True)
    heritage = relationship("HeritageModel", back_populates="quizzes")
