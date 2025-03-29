from .database import Base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, select
from sqlalchemy.orm import relationship

class ImageModel(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), unique=True, index=True)
    timestamp = Column(DateTime)
    heritages = relationship("HeritageModel", back_populates="image")

class HeritageModel(Base):
    __tablename__ = "heritages"
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"))
    image = relationship("ImageModel", back_populates="heritages")
    title = Column(String(255))
    description = Column(Text)
    criteria = Column(JSON)
