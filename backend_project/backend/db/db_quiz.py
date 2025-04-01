from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from .models import QuizModel
from typing import List, Dict, Any, Optional

async def create_quiz(db: AsyncSession, heritage_id: int, quiz_data: Dict[str, Any]) -> QuizModel:
