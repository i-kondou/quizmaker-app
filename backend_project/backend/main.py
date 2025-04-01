from fastapi import FastAPI
from .db import models
from .db.database import async_engine, Base
from .routers import image, heritage, quiz
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio

app = FastAPI()

app.include_router(image.router)
app.include_router(heritage.router)
app.include_router(quiz.router)

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory="backend/images"), name="images")
@app.on_event("startup")
async def on_startup():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__=="__main__":
    uvicorn.run("main:app",port=8000, reload=True)
