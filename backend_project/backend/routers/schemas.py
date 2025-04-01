from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

class ImageBase(BaseModel):
    filename: str
    timestamp: datetime

class ImageDisplay(BaseModel):
    imade_id: int = Field(..., alias="id")
    filename: str
    timestamp: datetime
    model_config = ConfigDict(
        from_attributes=True
    )

class HeritageItemPayload(BaseModel):
    title: str
    description: str
    criteria: List[int]

class HeritageItemResponse(BaseModel):
    content: List[HeritageItemPayload]

class HeritageSchema(BaseModel):
    id: int
    image_id: int
    title: str
    description: Optional[str] = None
    summary: Optional[str] = None
    simple_summary: Optional[List[str]] = None
    criteria: Optional[List[int]] = None
    unesco_tag: Optional[str] = None
    country: Optional[List[str]] = None
    region: Optional[List[str]] = None
    feature: Optional[List[str]] = None
    model_config = ConfigDict(from_attributes=True)

class HeritageListResponseSchema(BaseModel):
    content: List[HeritageSchema]

class HeritageUpdateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    summary: Optional[str] = None
    simple_summary: Optional[List[str]] = None
    criteria: Optional[List[int]] = None
    unesco_tag: Optional[str] = None
    country: Optional[List[str]] = None
    region: Optional[List[str]] = None
    feature: Optional[List[str]] = None
