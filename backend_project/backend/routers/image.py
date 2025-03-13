from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import io
from os import environ
from PIL import Image
from google import genai
from google.genai import types
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import Optional
from typing_extensions import Annotated, TypedDict
import string
import random
import shutil
import base64

router = APIRouter(
    prefix="/image",
    tags=["image"],
    responses={404: {"description": "Not found"}},
)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")

class Explain(TypedDict):
    title: Annotated[str, ..., "画像内にある世界遺産の名前"]
    description: Annotated[str, ..., "画像内にある世界遺産の説明"]

@router.post("/save")
async def save_image(image: UploadFile = File(...)):
    letters = string.ascii_letters
    rand_str = ''.join(random.choice(letters) for i in range(6))
    new = f"_{rand_str}."
    filename = new.join(image.filename.rsplit(".", 1))
    path = f"backend/images/{filename}"
    web_path = f"images/{filename}"
    with open(path, "w+b") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return {"filename": web_path}

@router.post("/ocr/{filename}")
async def ocr_image(filename: str):
    path = f"backend/images/{filename}"
    extention = filename.split(".")[-1]
    with open(path, "r+b") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
    message = HumanMessage(
        content=[
            {"type": "text", "text": "画像には世界遺産についての情報が含まれています。"},
            {"type": "image_url", "image_url": f"data:image/{extention};base64,{encoded_string}"},
        ]
    )
    strucutred_llm = llm.with_structured_output(Explain)
    response = strucutred_llm.invoke([message])
    return response
