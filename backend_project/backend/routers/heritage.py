from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..db.database import get_db
from ..db import db_image, db_heritage, db_quiz
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
    prefix="/heritage",
    tags=["heritage"],
    responses={404: {"description": "Not found"}},
)

def get_unesco_tag(criteria: Optional[List[int]]) -> Optional[str]:
    """登録基準リストからUNESCO分類タグを判定する"""
    if not criteria: return None
    # print(f"get_unesco_tag received criteria: {criteria}") # デバッグ用
    has_cultural = any(1 <= c <= 6 for c in criteria)
    has_natural = any(7 <= c <= 10 for c in criteria)
    if has_cultural and has_natural: return "複合遺産"
    elif has_cultural: return "文化遺産"
    elif has_natural: return "自然遺産"
    else: return None


class HeritageItem(TypedDict):
    title: Annotated[str, ..., "世界遺産の正式名称 (必須)"]
    description: Annotated[str, ..., "世界遺産の説明文全体"]
    summary: Annotated[str, ..., "説明文を80字程度に要約 (世界遺産名を含めない)"]
    simple_summary: Annotated[List[str], ..., "その世界遺産を特定できるような簡単な情報を3つの箇条書きリスト (世界遺産名を含めない)"]
    criteria: Annotated[List[int], ..., "登録基準のローマ数字をアラビア数字のリストに変換 (例: [1, 4])"]
    country: Annotated[List[str], ..., "世界遺産が存在する国名(複数可)"]
    region: Annotated[List[str], ..., ("世界遺産がある大陸名を選択肢から選んでください．"
        "選択肢: "
        "アジア, ヨーロッパ, アフリカ, 北アメリカ, 南アメリカ, オセアニア")]
    feature: Annotated[List[str], ..., ("世界遺産の特徴を選択肢から選んでください．当てはまる全ての特徴を選択してください．"
        "選択肢: "
        """宗教建築, キリスト教建築, イスラム建築, 仏教建築, ヒンドゥー教建築, 神社建築, その他宗教建築, 宮殿・邸宅, 城郭・要塞, 遺跡・考古学的遺跡, 歴史的都市・集落, 文化的景観, 産業遺産, 交通遺産, 庭園・公園, 古墳・墓所, 記念建造物, 岩絵・壁画, 負の遺産, 山岳・山脈, 火山・火山地形, 森林, 砂漠, 河川・湖沼, 湿地・湿原, 氷河・氷床・フィヨルド, 海岸・崖, 島嶼, 海洋生態系, サンゴ礁, カルスト地形・洞窟, 滝, 特殊な地形・地質, 化石産地, 国立公園・自然保護区""")]

class HeritageResponse(TypedDict):
    content: List[HeritageItem]

llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")
IMAGE_FORDER = os.getenv("IMAGE_FORDER", "backend/images")

def check_region(tag: str) -> bool:
    """指定されたタグが正しいかどうかを確認する"""
    valid_tags = [
        "アジア", "ヨーロッパ", "アフリカ", "北アメリカ", "南アメリカ", "オセアニア"
    ]
    return tag in valid_tags
def check_feature(tag: str) -> bool:
    """指定されたタグが正しいかどうかを確認する"""
    valid_tags = [
        "宗教建築", "キリスト教建築", "イスラム建築", "仏教建築", "ヒンドゥー教建築",
        "神社建築", "その他宗教建築", "宮殿・邸宅", "城郭・要塞", "遺跡・考古学的遺跡",
        "歴史的都市・集落", "文化的景観", "産業遺産", "交通遺産", "庭園・公園",
        "古墳・墓所", "記念建造物", "岩絵・壁画", "負の遺産", "山岳・山脈",
        "火山・火山地形", "森林", "砂漠", "河川・湖沼", "湿地・湿原",
        "氷河・氷床・フィヨルド", "海岸・崖", "島嶼", "海洋生態系",
        "サンゴ礁", "カルスト地形・洞窟", "滝",
        "特殊な地形・地質",  # 追加
        "化石産地",
        # 他のタグも追加可能
    ]
    return tag in valid_tags


@router.post("/preview/{image_id}", response_model=HeritageListResponseSchema)
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
                "text": "画像には一つ，または複数の世界遺産についての情報が含まれています。画像内にある世界遺産の名前，説明，世界遺産の登録基準の数値，国名を画像からそのまま抽出してください。大陸名，特徴は選択肢から選んでください．"
            },
            {
                "type": "image_url",
                "image_url": f"data:image/{extention};base64,{encoded_string}"
            },
        ]
    )
    strucutred_llm = llm.with_structured_output(HeritageResponse)
    try:
        llm_response: HeritageResponse = await strucutred_llm.ainvoke([message])
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process image with LLM")

    if llm_response and llm_response.get("content"):
        for item in llm_response["content"]:
            unesco_tag = get_unesco_tag(item.get("criteria"))
            if unesco_tag:
                item["unesco_tag"] = unesco_tag
            item["image_id"] = image_id
            item["region"] = item.get("region")
            item["feature"] = item.get("feature")
            if not check_region(item["region"]):
                raise HTTPException(status_code=400, detail="Invalid region tag")
            if not all(check_feature(tag) for tag in item["feature"]):
                raise HTTPException(status_code=400, detail="Invalid feature tag")


    try:
        saved_heritages = await db_heritage.create_multiple_heritages(db, image_id, llm_response["content"])
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail="n unexpected error occurred while saving data.")

    return {"content": saved_heritages}

@router.post("/view/{image_id}", response_model=HeritageListResponseSchema)
async def confirm_ocr_image(image_id: int, db: AsyncSession = Depends(get_db)):
    image_record = await db_image.get_by_id(db, image_id)
    if not image_record:
        raise HTTPException(status_code=404, detail="Image not found")
    heritage_records = await db_heritage.get_heritages_by_image_id(db, image_id)

    return {"content": heritage_records}

@router.get("/all", response_model=List[HeritageSchema])
async def get_all_heritages(db: AsyncSession = Depends(get_db)):
    heritages = await db_heritage.get_all_heritages(db)
    return heritages

@router.get("/detail/{heritage_id}", response_model=HeritageSchema)
async def get_heritage_detail_endpoint(heritage_id: int, db: AsyncSession = Depends(get_db)):
    """指定されたIDの世界遺産詳細を取得する"""
    heritage = await db_heritage.get_heritage_by_id(db, heritage_id)
    if heritage is None:
        raise HTTPException(status_code=404, detail="Heritage not found")
    return heritage

@router.put("/update/{heritage_id}", response_model=HeritageSchema)
async def update_single_heritage_endpoint(
    heritage_id: int,
    heritage_data: HeritageUpdateSchema, # 更新用スキーマを使用
    db: AsyncSession = Depends(get_db),
):
    """指定されたIDの世界遺産情報を更新する"""
    update_data_dict = heritage_data.model_dump(exclude_unset=True)
    updated_heritage = await db_heritage.update_single_heritage(db, heritage_id, update_data_dict)

    if updated_heritage is None:
        raise HTTPException(status_code=404, detail="Heritage not found")

    return updated_heritage
