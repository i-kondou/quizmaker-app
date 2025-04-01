from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..db.database import get_db
from ..db import db_image, db_heritage
from ..db.models import HeritageModel
from .schemas import HeritageSchema, HeritageUpdateSchema, HeritageListResponseSchema
import base64
import aiofiles
import os
from google import genai
from google.genai import types
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import List, Optional
from typing_extensions import Annotated, TypedDict

router = APIRouter(
    prefix="/quiz",
    tags=["quiz"],
    responses={404: {"description": "Not found"}},
)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")

class QuizItem(TypedDict):
    question: Annotated[str, ..., "4択のクイズの問題文を作成してください"]
    options: Annotated[List[str], ..., "4つの選択肢を作成してください"]
    answer: Annotated[str, ..., "正解の選択肢を選んでください"]

class QuizResponse(TypedDict):
    content: List[QuizItem]

@router.post("/generate/{heritage_id}")
async def generate_quiz(heritage_id: int, db: AsyncSession = Depends(get_db)):
    record = await db_heritage.get_heritage_by_id(db, heritage_id)
    if not record:
        raise HTTPException(status_code=404, detail="Heritage not found")
    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": "対象の世界遺産とその説明から4択のクイズを3つ作成してください。"
            },
            {
                "type": "text",
                "text": f"対象の世界遺産：{record.title} 説明：{record.description} 登録基準：{record.criteria}"
            },
        ]
    )
    structured_llm = llm.with_structured_output(QuizResponse)
    try:
        response: QuizResponse = structured_llm.invoke([message])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

    return response
