from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime

class DbUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True)
    email = Column(String(255), unique=True)
    hashed_password = Column(String(255))

class DbImage(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(255), unique=True)
    image_url_type = Column(String(255))
    timestamp = Column(Integer)
