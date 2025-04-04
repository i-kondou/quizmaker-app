from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from .models import QuizModel
from typing import List, Dict, Any, Optional


async def create_multiple_quizzes(db: AsyncSession, heritage_id: int, quiz_data_list: List[Dict[str, Any]]) -> List[QuizModel]:
    new_quizzes = []
    for quiz_data in quiz_data_list:
        print(f"Creating quiz with data: {quiz_data}")  # Debugging line
        new_quiz = QuizModel(
            heritage_id=heritage_id,
            question=quiz_data.get("question"),
            options=quiz_data.get("options"),
            answer=quiz_data.get("answer"),
        )
        db.add(new_quiz)
        new_quizzes.append(new_quiz)
    try:
        await db.commit()
        for quiz in new_quizzes:
            await db.refresh(quiz)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"DB commit failed: {str(e)}")
    return new_quizzes

async def get_all_quizzes(db: AsyncSession) -> List[QuizModel]:
    stmt = select(QuizModel)
    stmt = stmt.order_by(QuizModel.question.asc())
    result = await db.execute(stmt)
    quizzes = result.scalars().all()
    if not quizzes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No quizzes found")
    return quizzes

async def get_quizzes_by_heritage_id(db: AsyncSession, heritage_id: int) -> List[QuizModel]:
    stmt = select(QuizModel).where(QuizModel.heritage_id == heritage_id)
    result = await db.execute(stmt)
    quizzes = result.scalars().all()
    if not quizzes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No quizzes found for this heritage")
    return quizzes

async def get_quiz_by_id(db: AsyncSession, quiz_id: int) -> Optional[QuizModel]:
    stmt = select(QuizModel).where(QuizModel.id == quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz

async def update_quiz(db: AsyncSession, quiz_id: int, quiz_update_data: Dict[str, Any]) -> Optional[QuizModel]:
    quiz = await get_quiz_by_id(db, quiz_id)
    if not quiz:
        return None
    for key, value in quiz_update_data.items():
        if hasattr(quiz, key):
            setattr(quiz, key, value)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid field: {key}")
    try:
        db.add(quiz)
        await db.commit()
        await db.refresh(quiz)
        return quiz
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"DB commit failed: {str(e)}")
