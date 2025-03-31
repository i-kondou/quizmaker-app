from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from .models import HeritageModel
from typing import List, Dict, Any

async def create_heritage(db: AsyncSession, image_id: int, heritage_data: Dict[str, Any]) -> HeritageModel:
    new_heritage = HeritageModel(
        image_id=image_id,
        title=heritage_data.get("title"),
        description=heritage_data.get("description"),
        criteria=heritage_data.get("criteria"),
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
            criteria=heritage_data.get("criteria"),
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

async def update_heritages(db: AsyncSession, image_id: int, heritages_data: List[Dict[str, Any]]) -> List[HeritageModel]:
    updated_heritages = []
    try:
        await delete_heritages_by_image_id(db, image_id)
        for heritage_data in heritages_data:
            if not heritage_data.get("title"):
                raise HTTPException(status_code=400, detail=f"Title is required.")

            db_heritage = HeritageModel(
                image_id=image_id,
                title=heritage_data.get("title"),
                description=heritage_data.get("description"),
                criteria=heritage_data.get("criteria")
            )
            db.add(db_heritage)
            updated_heritages.append(db_heritage)

        await db.commit()
        for db_h in updated_heritages:
            await db.refresh(db_h)

        print(f"Successfully updated heritages for image_id {image_id}")
        return updated_heritages

    except HTTPException as http_exc:
        await db.rollback()
        raise http_exc
    except Exception as e:
        await db.rollback()
        print(f"Error updating heritages: {e}")
        raise HTTPException(status_code=500, detail="Failed to update heritage data in database.")
