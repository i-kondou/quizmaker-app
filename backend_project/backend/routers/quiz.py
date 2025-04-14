from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..db.database import get_db
from ..db import db_image, db_heritage, db_quiz
from ..db.models import HeritageModel, QuizModel
from .schemas import HeritageSchema, HeritageUpdateSchema, HeritageListResponseSchema, QuizSchema, QuizListResponseSchema, QuizUpdateSchema
import base64
import aiofiles
import os
from google import genai
from google.genai import types
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import List, Optional
from typing_extensions import Annotated, TypedDict
import random

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

def calculate_tag_similarity(tags1: Optional[List[str]], tags2: Optional[List[str]]) -> int:
    """タグリスト間の共通要素数を返す"""
    if not tags1 or not tags2:
        return 0
    set1 = set(tags1)
    set2 = set(tags2)
    return len(set1.intersection(set2))

def find_distractors(
    target: HeritageModel,
    candidates: List[HeritageModel],
    num_distractors: int = 3
) -> List[HeritageModel]:
    """
    個別のタグフィールドを参照して類似度に基づきダミー選択肢を探す
    """
    distractors_found: List[HeritageModel] = []
    target_id = target.id
    target_unesco = target.unesco_tag
    target_region_list = target.region or []
    target_feature_set = set(target.feature or [])

    # 自分自身を除外し、候補をシャッフル
    valid_candidates = [c for c in candidates if c.id != target_id]
    random.shuffle(valid_candidates)

    # UNESCOタグのマッチング関数 (複合遺産を考慮)
    def check_unesco_match(unesco1: Optional[str], unesco2: Optional[str]) -> bool:
        if not unesco1 or not unesco2: return False
        if unesco1 == unesco2: return True
        # 正解が文化遺産/自然遺産の場合、複合遺産も候補として許容
        if unesco1 == "文化遺産" and unesco2 == "複合遺産": return True
        if unesco1 == "自然遺産" and unesco2 == "複合遺産": return True
        # 正解が複合遺産の場合、文化/自然遺産も候補として許容
        if unesco1 == "複合遺産" and unesco2 == "文化遺産": return True
        if unesco1 == "複合遺産" and unesco2 == "自然遺産": return True
        return False

    # 地域タグのマッチング関数 (リストの最初の要素が一致するか、またはリストが一致するか)
    # 単一地域を想定する場合は前者、複数地域を許容する場合は後者や共通要素確認
    def check_region_match(region1_list: Optional[List[str]], region2_list: Optional[List[str]]) -> bool:
        if not region1_list or not region2_list: return False
        # 最も単純な比較: 最初の要素が同じか (単一地域タグを想定)
        return region1_list[0] == region2_list[0]
        # または、共通の地域タグが一つでもあればマッチとする場合:
        # return bool(set(region1_list) & set(region2_list))

    processed_candidate_ids = set() # 処理済み候補ID

    # --- 優先度に基づいてダミー選択肢を検索 ---
    # Tier 1: UNESCO一致 & 地域一致 & 特徴が類似 (例: 半分以上一致)
    for cand in valid_candidates:
        if len(distractors_found) >= num_distractors: break
        if cand.id in processed_candidate_ids: continue

        # cand_unesco = get_unesco_tag(cand.criteria) # DBに unesco_tag がない場合
        cand_unesco = cand.unesco_tag # DBに保存されていると仮定
        cand_region_list = cand.region or []
        cand_feature_set = set(cand.feature or [])

        if check_unesco_match(target_unesco, cand_unesco) and \
           check_region_match(target_region_list, cand_region_list):
            common_features = len(target_feature_set.intersection(cand_feature_set))
            # 類似度の閾値 (調整可能)
            # 例1: ターゲットに特徴があり、共通の特徴が1つ以上ある
            # 例2: ターゲットの特徴の半分以上が共通している
            if target_feature_set and common_features >= max(1, len(target_feature_set) // 2):
                 distractors_found.append(cand)
                 processed_candidate_ids.add(cand.id)

    # Tier 2: UNESCO一致 & 地域一致 (特徴は問わない)
    if len(distractors_found) < num_distractors:
        for cand in valid_candidates:
            if len(distractors_found) >= num_distractors: break
            if cand.id in processed_candidate_ids: continue

            # cand_unesco = get_unesco_tag(cand.criteria)
            cand_unesco = cand.unesco_tag
            cand_region_list = cand.region or []

            if check_unesco_match(target_unesco, cand_unesco) and \
               check_region_match(target_region_list, cand_region_list):
                 distractors_found.append(cand)
                 processed_candidate_ids.add(cand.id)

    # Tier 3: UNESCO一致のみ
    if len(distractors_found) < num_distractors:
        for cand in valid_candidates:
            if len(distractors_found) >= num_distractors: break
            if cand.id in processed_candidate_ids: continue

            # cand_unesco = get_unesco_tag(cand.criteria)
            cand_unesco = cand.unesco_tag

            if check_unesco_match(target_unesco, cand_unesco):
                 distractors_found.append(cand)
                 processed_candidate_ids.add(cand.id)

    # Fallback: それでも足りなければ残りの候補からランダムに追加
    if len(distractors_found) < num_distractors:
        remaining_candidates = [c for c in valid_candidates if c.id not in processed_candidate_ids]
        needed = num_distractors - len(distractors_found)
        distractors_found.extend(random.sample(remaining_candidates, min(needed, len(remaining_candidates))))

    # 最終的に num_distractors 個に絞る (多く見つかりすぎた場合)
    return distractors_found[:num_distractors]

@router.post("/generate/{heritage_id}")
async def generate_quiz(heritage_id: int, db: AsyncSession = Depends(get_db)):
    """ LLMによるクイズ作成 """
    record = await db_heritage.get_heritage_by_id(db, heritage_id)
    if not record:
        raise HTTPException(status_code=404, detail="Heritage not found")
    number_of_quizzes = 2
    if len(record.description) >= 500:
        number_of_quizzes = 3
    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": f"対象の世界遺産とその説明から4択のクイズを{number_of_quizzes}つ作成してください．"
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

    for quiz in response["content"]:
        if quiz.get("question") and quiz.get("options") and quiz.get("answer"):
            quiz["question"] = f"「{record.title}」に関する問題です．" + quiz["question"]

    """ 世界遺産のデータに基づき，ルールベースでクイズを生成 """
    target_heritage = await db_heritage.get_heritage_by_id(db, heritage_id)
    if not target_heritage:
        raise HTTPException(status_code=404, detail="Heritage not found")

    candidate_heritages = await db_heritage.get_all_heritages_except_id(db, heritage_id)
    if not candidate_heritages:
        raise HTTPException(status_code=404, detail="No candidate heritages found")

    num_distractors = 3

    # Quiz Type 1: 簡易要約を基にしたクイズ
    if target_heritage.simple_summary and len(target_heritage.simple_summary) >= 3:
        distractor_models_t1 = find_distractors(target_heritage, candidate_heritages, num_distractors)
        if len(distractor_models_t1) == num_distractors: # ダミーが3つ見つかった場合のみ作成
            question_text = "次の３つの説明文から推測される遺産として，正しいものはどれか．\n" + "\n".join(f"- {s}" for s in target_heritage.simple_summary[:3])
            options = [d.title for d in distractor_models_t1] + [target_heritage.title]
            random.shuffle(options)
            response["content"].append({
                "question": question_text,
                "options": options,
                "answer": target_heritage.title
            })
        else:
            print(f"Warning: Could not find enough distractors for Quiz Type 1 (Simple Summary) for ID {heritage_id}")

    # Quiz Type 2: 要約を当てるクイズ
    if target_heritage.summary:
        distractor_models_t2 = find_distractors(target_heritage, candidate_heritages, num_distractors)
        if len(distractor_models_t2) == num_distractors:
             question_text = f"「{target_heritage.title}」の説明として，正しいものはどれか"
             options = [d.summary for d in distractor_models_t2] + [target_heritage.summary]
             random.shuffle(options)
             response["content"].append({
                 "question": question_text,
                 "options": options,
                 "answer": target_heritage.summary
             })
        else:
            print(f"Warning: Could not find enough distractors for Quiz Type 2 (Summary) for ID {heritage_id}")


    try: # Debugging line
        saved_quizzes = await db_quiz.create_multiple_quizzes(db, heritage_id, response["content"])
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred while saving data.")

    return response

@router.get("/all", response_model=List[QuizSchema])
async def get_all_quizzes(db: AsyncSession = Depends(get_db)):
    """ 全てのクイズを取得 """
    return await db_quiz.get_all_quizzes(db)

@router.get("/list/{heritage_id}", response_model=List[QuizSchema])
async def get_quizzes_by_heritage_id_endpoint(
    heritage_id: int,
    db: AsyncSession = Depends(get_db),
):
    """指定されたIDの世界遺産に関連するクイズを取得する"""
    quizzes_models = await db_quiz.get_quizzes_by_heritage_id(db, heritage_id)
    if not quizzes_models:
        raise HTTPException(status_code=404, detail="No quizzes found for this heritage")

    return quizzes_models

@router.put("/update/{quiz_id}", response_model=QuizSchema)
async def update_quiz_detail_endpoint(
    quiz_id: int,
    quiz_data: QuizUpdateSchema,
    db: AsyncSession = Depends(get_db),
):
    """指定されたIDのクイズ情報を更新する"""
    update_data_dict = quiz_data.model_dump(exclude_unset=True)
    if not update_data_dict:
        raise HTTPException(status_code=400, detail="No data provided for update")
    updated_quiz = await db_quiz.update_quiz(db, quiz_id, update_data_dict)

    if updated_quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return updated_quiz
