from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update, func as sql_func
from .models import HeritageModel
from typing import List, Dict, Any, Optional

async def create_heritage(db: AsyncSession, image_id: int, heritage_data: Dict[str, Any]) -> HeritageModel:
    new_heritage = HeritageModel(
        image_id=image_id,
        title=heritage_data.get("title"),
        description=heritage_data.get("description"),
        summary=heritage_data.get("summary"),
        simple_summary=heritage_data.get("simple_summary"),
        criteria=heritage_data.get("criteria"),
        unesco_tag=heritage_data.get("unesco_tag"),
        country=heritage_data.get("country"),
        region=heritage_data.get("region"),
        feature=heritage_data.get("feature"),
    )
    db.add(new_heritage)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"DB commit failed: {str(e)}")
    await db.refresh(new_heritage)
    return new_heritage

async def create_multiple_heritages(db: AsyncSession, image_id: int, heritage_data_list: List[Dict[str, Any]]) -> List[HeritageModel]:
    new_heritages = []
    for heritage_data in heritage_data_list:
        new_heritage = HeritageModel(
            image_id=image_id,
            title=heritage_data.get("title"),
            description=heritage_data.get("description"),
            summary=heritage_data.get("summary"),
            simple_summary=heritage_data.get("simple_summary"),
            criteria=heritage_data.get("criteria"),
            unesco_tag=heritage_data.get("unesco_tag"),
            country=heritage_data.get("country"),
            region=heritage_data.get("region"),
            feature=heritage_data.get("feature"),
        )
        db.add(new_heritage)
        new_heritages.append(new_heritage)
    try:
        await db.commit()
        for heritage in new_heritages:
            await db.refresh(heritage)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"DB commit failed: {str(e)}")
    return new_heritages

async def get_all_heritages(db: AsyncSession) -> List[HeritageModel]:
    stmt = select(HeritageModel)
    stmt = stmt.order_by(HeritageModel.title.asc())
    result = await db.execute(stmt)
    heritages = result.scalars().all()
    if not heritages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No heritages found")
    return heritages

async def get_heritages_by_image_id(db: AsyncSession, image_id: int) -> List[HeritageModel]:
    result = await db.execute(select(HeritageModel).where(HeritageModel.image_id == image_id))
    heritages = result.scalars().all()
    if not heritages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No heritages found for this image")
    return heritages

async def delete_heritages_by_image_id(db: AsyncSession, image_id: int) -> int:
    stmt = delete(HeritageModel).where(HeritageModel.image_id == image_id)
    result = await db.execute(stmt)
    deleted_count = result.rowcount
    print(f"Attempted to delete heritages for image_id {image_id}. Rows affected: {deleted_count}")
    return deleted_count


async def get_heritage_by_id(db: AsyncSession, heritage_id: int) -> Optional[HeritageModel]:
    result = await db.execute(select(HeritageModel).where(HeritageModel.id == heritage_id))
    heritage = result.scalars().first()
    if not heritage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heritage not found")
    return heritage

async def update_single_heritage(db: AsyncSession, heritage_id: int, heritage_update_data: Dict[str, Any]) -> Optional[HeritageModel]:
    heritage = await get_heritage_by_id(db, heritage_id)
    if not heritage:
        return None

    for key, value in heritage_update_data.items():
        if hasattr(heritage, key):
            setattr(heritage, key, value)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid field: {key}")
    try:
        db.add(heritage)
        await db.commit()
        await db.refresh(heritage)
        return heritage
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"DB commit failed: {str(e)}")

async def get_all_heritages_except_id(db: AsyncSession, exclude_id: int) -> List[HeritageModel]:
    """指定されたID以外のすべての世界遺産データを取得する"""
    stmt = select(HeritageModel).where(HeritageModel.id != exclude_id).order_by(sql_func.random())
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_all_heritages(db: AsyncSession) -> List[HeritageModel]:
     """すべての世界遺産データを取得する"""
     stmt = select(HeritageModel).order_by(HeritageModel.title.asc())
     result = await db.execute(stmt)
     return result.scalars().all()
