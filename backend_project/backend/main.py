from fastapi import FastAPI
from .db import models
from .db.database import async_engine
from .routers import image
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.include_router(image.router)

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

if __name__=="__main__":
    uvicorn.run("main:app",port=8000, reload=True)
