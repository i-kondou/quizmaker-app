from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.database import get_db
from ..db import db_image, db_heritage
from .schemas import HeritageItemDisplay
import base64
import aiofiles
import os
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

IMAGE_FORDER = os.getenv("IMAGE_FORDER", "backend/images")

@router.post("/preview/{image_id}")
async def preview_ocr_image(image_id: int, db: AsyncSession = Depends(get_db)):
    record = await db_image.get_by_id(db, image_id)
    if not record:
        raise HTTPException(status_code=404, detail="Image not found")
    filename = record.filename.split("/")[-1]
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
    try:
        response: HeritageResponse = strucutred_llm.invoke([message])
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process image with LLM")

    try:
        saved_heritages = await db_heritage.create_multiple_heritages(db, image_id, response["content"])
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail="n unexpected error occurred while saving data.")

    return response

@router.post("/view/{image_id}", response_model=HeritageResponse)
async def confirm_ocr_image(image_id: int, db: AsyncSession = Depends(get_db)):
    image_record = await db_image.get_by_id(db, image_id)
    if not image_record:
        raise HTTPException(status_code=404, detail="Image not found")

    heritage_records = await db_heritage.get_heritages_by_image_id(db, image_id)

    content_list = [
        {"title": record.title, "description": record.description, "criteria": record.criteria}
        for record in heritage_records
    ]
    response = {"content": content_list}
    return response

@router.get("/all", response_model=List[HeritageItemDisplay])
async def get_all_heritages(db: AsyncSession = Depends(get_db)):
    return await db_heritage.get_all_heritages(db)

@router.put("/update/{image_id}", status_code=200, response_model=HeritageResponse)
async def update_heritages_for_image(
    image_id: int,
    heritage_data: HeritageResponse,
    db: AsyncSession = Depends(get_db),
):
    image_record = await db_image.get_by_id(db, image_id)
    if not image_record:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        updated_heritages_models = await db_heritage.update_heritages(db, image_id, heritage_data.get("content", []))
        response = [
            {"title": model.title, "description": model.description, "criteria": model.criteria}
            for model in updated_heritages_models
        ]
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating data.")
    return {"content": response}
