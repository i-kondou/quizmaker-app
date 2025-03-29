from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.database import get_db
import base64
import aiofiles
import os
from PIL import Image
from google import genai
from google.genai import types
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import List
from typing_extensions import Annotated, TypedDict

router = APIRouter(
    prefix="/heritage",
    tags=["heritage"],
    responses={404: {"description": "Not found"}},
)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")

class HeritageItem(TypedDict):
    title: Annotated[str, ..., "画像内にある世界遺産の名前を画像からそのまま抽出してください"]
    description: Annotated[str, ..., "画像内にある世界遺産の説明を完全にそのまま抽出してください"]
    criteria: Annotated[List[int], ..., "画像内にある世界遺産の登録基準のローマ数字を数字に変換して抽出してください"]

class HeritageResponse(TypedDict):
    content: List[HeritageItem]

ocr_results_tmp = {}

IMAGE_FORDER = os.getenv("IMAGE_FORDER", "backend/images")

@router.post("/preview/{filename}")
async def preview_ocr_image(filename: str):
    path = os.path.join(IMAGE_FORDER, filename)
    extention = filename.split(".")[-1]
    try:
        async with aiofiles.open(path, "rb") as image_file:
            encoded_string = base64.b64encode(await image_file.read()).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Image not found")

    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": "画像には一つ，または複数の世界遺産についての情報が含まれています。画像内にある世界遺産の名前，説明，世界遺産の登録基準の数値を画像からそのまま抽出してください。"
            },
            {
                "type": "image_url",
                "image_url": f"data:image/{extention};base64,{encoded_string}"
            },
        ]
    )
    strucutred_llm = llm.with_structured_output(HeritageResponse)
    response = strucutred_llm.invoke([message])
    ocr_results_tmp[filename] = response
    return response

@router.post("/confirm/{filename}")
async def confirm_ocr_image(filename: str):
    return ocr_results_tmp[filename]
