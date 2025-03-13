from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import io
import numpy as np
from PIL import Image
import cv2
import pytesseract

router = APIRouter(
    prefix="/image",
    tags=["image"],
    responses={404: {"description": "Not found"}},
)

@router.post("/ocr/")
async def ocr_image(file: UploadFile = File(...)):
    # アップロードされた画像データをバイナリで読み込む
    image_bytes = await file.read()
    # Pillow で画像を開く
    pil_image = Image.open(io.BytesIO(image_bytes))
    # PIL.Image から OpenCV 形式の配列に変換（RGB -> BGR）
    cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

    # 前処理: グレースケール変換
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)

    # ノイズ除去: メディアンブラーの適用（カーネルサイズは3）
    blurred = cv2.medianBlur(gray, 3)

    # しきい値処理: 自動しきい値（二値化、Otsu法またはadaptive thresholdを使用可能）
    # ここでは、adaptive threshold を例示
    thresh = cv2.adaptiveThreshold(
        blurred, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    # pytesseract による文字認識（日本語対応の場合、事前に日本語用の言語データをインストールしてください）
    extracted_text = pytesseract.image_to_string(thresh, lang='jpn')

    return JSONResponse(content={"extracted_text": extracted_text})
