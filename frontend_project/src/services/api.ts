// src/services/api.ts
import { ImageData, HeritageResponse } from "../types"; // 型定義をインポート

const BACKEND_URL = "http://localhost:8000";

// 画像一覧取得
export const fetchImagesAPI = async (): Promise<ImageData[]> => {
  const response = await fetch(`${BACKEND_URL}/image/all`);
  if (!response.ok) {
    throw new Error("画像の取得に失敗しました");
  }
  return await response.json();
};

// 画像アップロード
export const uploadImageAPI = async (file: File): Promise<Response> => {
  // 単純化のためResponseを返す
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch(`${BACKEND_URL}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("画像のアップロードに失敗しました");
  }
  return response; // 成功時はResponseオブジェクトを返す
};

// 画像削除
export const deleteImageAPI = async (imageId: number): Promise<Response> => {
  const response = await fetch(`${BACKEND_URL}/image/delete/${imageId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("画像の削除に失敗しました");
  }
  return response;
};

// 解析結果取得
export const fetchAnalysisResultAPI = async (
  imageId: number
): Promise<HeritageResponse> => {
  const response = await fetch(`${BACKEND_URL}/heritage/view/${imageId}`, {
    method: "POST",
  });
  if (!response.ok) {
    // 404はデータなしとして扱うことが多いが、ここでは一旦エラーとして投げる
    // 呼び出し元で statusを見てハンドリングする方が良い場合もある
    throw new Error(`解析結果の取得に失敗しました (${response.status})`);
  }
  const data = await response.json();
  // contentがない、または配列でない場合も考慮した方がより安全
  return data as HeritageResponse; // 型アサーション (必要なら zodなどでバリデーション)
};

// LLM解析実行＆保存
export const analyzeAndSaveHeritageAPI = async (
  imageId: number
): Promise<HeritageResponse> => {
  const response = await fetch(`${BACKEND_URL}/heritage/preview/${imageId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`解析と保存に失敗しました (${response.status})`);
  }
  return await response.json();
};

// 解析結果更新
export const updateHeritageAPI = async (
  imageId: number,
  data: HeritageResponse
): Promise<HeritageResponse> => {
  const response = await fetch(`${BACKEND_URL}/heritage/update/${imageId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`解析結果の更新に失敗しました (${response.status})`);
  }
  return await response.json();
};
