from fastapi import HTTPException, status
from ..routers.schemas import ImageBase
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from .models import ImageModel
from datetime import datetime

async def create(db: AsyncSession, request: ImageBase):
    new_image = ImageModel(
        filename=request.filename,
        timestamp=datetime.now()
    )
    db.add(new_image)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="DB commit failed: {str(e)}")
    await db.refresh(new_image)
    return new_image

async def get_all(db: AsyncSession):
    query = select(ImageModel)
    result = await db.execute(query)
    images = result.scalars().all()
    if not images:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No images found")
    return images

async def get_by_id(db: AsyncSession, id: int):
    result = await db.execute(select(ImageModel).where(ImageModel.id == id))
    image = result.scalars().first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return image

async def delete_by_id(db: AsyncSession, id: int):
    stmt = delete(ImageModel).where(ImageModel.id == id)
    result = await db.execute(stmt)
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return {"detail": "Image deleted successfully"}
