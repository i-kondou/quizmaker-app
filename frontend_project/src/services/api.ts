// src/services/api.ts
import {
  ImageData,
  HeritageResponse,
  HeritageData,
  HeritageWithId,
} from "../types"; // 型定義をインポート

const BACKEND_URL = "http://localhost:8000";

// API呼び出しエラーハンドリング
const handleApiResponse = async (response: Response, errorMessage: string) => {
  if (!response.ok) {
    let detail = errorMessage;
    try {
      const errorData = await response.json();
      detail = errorData.detail || errorMessage;
    } catch (error) {}
    throw new Error(`${detail} (Status: ${response.status})`);
  }
};

// 画像一覧取得
export const fetchImagesAPI = async (): Promise<ImageData[]> => {
  const response = await fetch(`${BACKEND_URL}/image/all`);
  await handleApiResponse(response, "画像一覧の取得に失敗しました");
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
  await handleApiResponse(response, "画像のアップロードに失敗しました");
  return response; // 成功時はResponseオブジェクトを返す
};

// 画像削除
export const deleteImageAPI = async (imageId: number): Promise<Response> => {
  const response = await fetch(`${BACKEND_URL}/image/delete/${imageId}`, {
    method: "DELETE",
  });
  await handleApiResponse(response, "画像の削除に失敗しました");
  return response;
};

// 解析結果取得
export const fetchAnalysisResultAPI = async (
  imageId: number
): Promise<HeritageResponse> => {
  const response = await fetch(`${BACKEND_URL}/heritage/view/${imageId}`, {
    method: "POST",
  });
  if (response.status === 404) {
    return { content: [] };
  }
  await handleApiResponse(response, "解析結果の取得に失敗しました");
  return await response.json();
};

// LLM解析実行&保存
export const analyzeAndSaveHeritageAPI = async (
  imageId: number
): Promise<HeritageResponse> => {
  const response = await fetch(`${BACKEND_URL}/heritage/preview/${imageId}`, {
    method: "POST",
  });
  await handleApiResponse(response, "解析と保存に失敗しました");
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
  await handleApiResponse(response, "解析結果の更新に失敗しました");
  return await response.json();
};

export const fetchAllHeritagesAPI = async (): Promise<HeritageWithId[]> => {
  const response = await fetch(`${BACKEND_URL}/heritage/all`);
  await handleApiResponse(response, "世界遺産データの取得に失敗しました");
  const data: HeritageWithId[] = await response.json();
  return data;
};

export const fetchHeritageDetailAPI = async (
  heritageId: number
): Promise<HeritageWithId> => {
  const response = await fetch(`${BACKEND_URL}/heritage/detail/${heritageId}`);
  await handleApiResponse(response, "世界遺産詳細データの取得に失敗しました");
  const data: HeritageWithId = await response.json();
  return data;
};

export const updateSingleHeritageAPI = async (
  heritageId: number,
  data: Omit<HeritageData, "id">
): Promise<HeritageWithId> => {
  const response = await fetch(`${BACKEND_URL}/heritage/update/${heritageId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await handleApiResponse(response, "世界遺産データの更新に失敗しました");
  return await response.json();
};

export const generateQuizAPI = async (heritageId: number): Promise<any> => {
  const response = await fetch(`${BACKEND_URL}/heritage/quiz/${heritageId}`, {
    method: "POST",
  });
  await handleApiResponse(response, "クイズの生成に失敗しました");
  const quizData = await response.json();
  return quizData;
};
