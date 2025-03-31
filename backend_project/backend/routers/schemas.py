from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List

class ImageBase(BaseModel):
    filename: str
    timestamp: datetime

class ImageDisplay(BaseModel):
    imade_id: int = Field(..., alias="id")
    filename: str
    timestamp: datetime
    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class HeritageItemPayload(BaseModel):
    title: str
    description: str
    criteria: List[int]

class HeritageItemResponse(BaseModel):
    content: List[HeritageItemPayload]

class HeritageItemDisplay(BaseModel):
    id: int
    image_id: int
    title: str
    description: str | None
    criteria: List[int] | None

    model_config = ConfigDict(
        from_attributes=True
    )
