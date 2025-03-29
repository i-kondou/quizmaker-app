from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.database import get_db
from ..db import db_image
from .schemas import ImageBase, ImageDisplay
import aiofiles
import uuid
import os
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from typing import List
from datetime import datetime

router = APIRouter(
    prefix="/image",
    tags=["image"],
    responses={404: {"description": "Not found"}},
)

IMAGE_FORDER = os.getenv("IMAGE_FORDER", "backend/images")
WEB_IMAGE_FORDER = os.getenv("WEB_IMAGE_FORDER", "images")


@router.get("/all", response_model=List[ImageDisplay])
async def get_all_images(db: AsyncSession = Depends(get_db)):
    return await db_image.get_all(db)

@router.post("/upload", response_model=ImageDisplay)
async def upload_image(image: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Check if the file is an image
    try:
        contents = await image.read()
        img = Image.open(BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")
    finally:
        image.file.seek(0)

    # Extract file extension
    filename_parts = image.filename.split(".", 1)
    if len(filename_parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid image file")
    ext = filename_parts[1]

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}.{ext}"

    path = os.path.join(IMAGE_FORDER, unique_filename)
    web_path = os.path.join(WEB_IMAGE_FORDER, unique_filename)

    # Save the image
    try:
        async with aiofiles.open(path, "wb") as out_file:
            file_content = await image.read()
            await out_file.write(file_content)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save image")

    # Save the image to the database
    image_data = ImageBase(
        filename=web_path,
        timestamp=datetime.utcnow()
    )

    try:
        record = await db_image.create(db, image_data)
    except Exception:
        if os.path.exists(path):
            os.remove(path)
        raise HTTPException(status_code=500, detail="Failed to save image")

    return record

@router.delete("/delete/{image_id}", response_model=dict)
async def delete_image(image_id: int, db: AsyncSession = Depends(get_db)):
    record = await db_image.get_by_id(db, image_id)
    if not record:
        raise HTTPException(status_code=404, detail="Image not found")
    unique_filename = record.filename.split("/")[-1]
    path = os.path.join(IMAGE_FORDER, unique_filename)
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            raise HTTPException(status_code=500, detail="Image file not found on server")
    else:
        pass

    return await db_image.delete_by_id(db, image_id)
