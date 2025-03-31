import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import AnalysisResultAccordion from "./AnalysisResultAccordion";
import { ImageData, HeritageData, HeritageResponse } from "../../types";

const BACKEND_URL = "http://localhost:8000"; // Propsで渡すかConfigファイル

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  selectedIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
  analysisResult: HeritageResponse | null;
  isFetchingResult: boolean;
  isAnalyzing: boolean;
  isSaving: boolean;
  fetchError: string | null;
  hasAnalyzedBefore: boolean;
  onAnalyze: () => void;
  onShowAnalysis: () => void;
  onBackToImage: () => void;
  editingIndex: number | null;
  editingData: HeritageData | null;
  onEditStart: (index: number, data: HeritageData) => void;
  onEditChange: (data: HeritageData) => void; // App -> ImageModal -> Accordion -> Form へ渡す
  onEditComplete: (index: number) => void;
  onEditCancel: () => void;
  accordionDefaultValue: string[];
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  images,
  selectedIndex,
  onPrev,
  onNext,
  onDelete,
  analysisResult,
  isFetchingResult,
  isAnalyzing,
  isSaving,
  fetchError,
  hasAnalyzedBefore,
  onAnalyze,
  onShowAnalysis,
  onBackToImage,
  editingIndex,
  editingData,
  onEditStart,
  onEditChange, // 受け取る
  onEditComplete,
  onEditCancel,
  accordionDefaultValue,
}) => {
  if (!isOpen || selectedIndex === null || !images[selectedIndex]) {
    return null;
  }

  const currentImage = images[selectedIndex];
  const isLoading = isFetchingResult || isAnalyzing || isSaving; // ローディング状態をまとめる

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      {/* --- 左矢印 --- */}
      <button
        onClick={onPrev}
        disabled={selectedIndex === 0 || isLoading}
        className={`absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-opacity disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8 md:w-10 md:h-10"
        >
          {" "}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />{" "}
        </svg>
        <span className="sr-only">前の画像</span>
      </button>

      {/* --- モーダル本体 --- */}
      <div className="relative bg-white p-6 rounded shadow-lg max-w-3xl w-[90%] max-h-[90vh] flex flex-col">
        {/* --- 閉じるボタン --- */}
        <button
          className={`absolute top-3 right-3 z-[51] p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors disabled:opacity-50`}
          onClick={onClose}
          disabled={isLoading}
          aria-label="閉じる"
        >
          {" "}
          <X className="w-5 h-5" />{" "}
        </button>

        {/* --- コンテンツエリア --- */}
        <div className="flex-grow overflow-y-auto pt-4 pr-2 relative min-h-[300px]">
          {/* エラー表示 */}
          {fetchError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded text-center">
              {fetchError}
            </div>
          )}

          {/* ローディング表示 */}
          {isFetchingResult && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 rounded">
              {" "}
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-gray-500" />{" "}
              <p className="mt-3 text-base md:text-lg font-semibold text-gray-600">
                データを取得中...
              </p>{" "}
            </div>
          )}

          {/* 解析結果表示 or 画像表示 */}
          {!isFetchingResult && analysisResult ? (
            // --- 解析結果表示 (Accordion) ---
            <AnalysisResultAccordion
              analysisResult={analysisResult}
              accordionDefaultValue={accordionDefaultValue}
              editingIndex={editingIndex}
              editingData={editingData}
              onEditStart={onEditStart}
              onEditChange={onEditChange} // Propsを渡す
              onEditComplete={onEditComplete}
              onEditCancel={onEditCancel}
              isSaving={isSaving}
            />
          ) : (
            // --- 画像表示モード ---
            <div className="flex flex-col justify-center items-center w-full h-full">
              <img
                src={`${BACKEND_URL}/${images[selectedIndex].filename}`}
                alt={`Selected ${images[selectedIndex].id}`}
                className={`max-w-full max-h-[70vh] object-contain transition-opacity ${
                  isAnalyzing ? "opacity-50" : "opacity-100"
                }`}
              />
              {/* 解析中スピナー */}
              {isAnalyzing /* --- LLM解析中 --- */ && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 rounded">
                  {" "}
                  <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-blue-600" />{" "}
                  <p className="mt-3 text-base md:text-lg font-semibold text-blue-700">
                    解析中...
                  </p>{" "}
                </div>
              )}
              {/* 解析済み/未解析 ボタン */}
              {!isFetchingResult &&
                !isAnalyzing &&
                !fetchError &&
                !hasAnalyzedBefore && ( // <<< !hasAnalyzedBefore を追加
                  <div className="mt-4 text-center text-gray-600">
                    {hasAnalyzedBefore ? (
                      <Button onClick={onShowAnalysis}> 解析結果を表示 </Button>
                    ) : (
                      <>
                        <p className="mb-2">まだ解析されていません。</p>
                        <Button onClick={onAnalyze} disabled={isAnalyzing}>
                          {" "}
                          {isAnalyzing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "この画像を解析する"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>

        {/* --- 下部ボタン群 --- */}
        <div className="mt-4 pt-4 border-t flex justify-center items-center space-x-4 flex-shrink-0">
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            onClick={onDelete}
            disabled={isLoading}
          >
            {" "}
            削除{" "}
          </Button>
          {!isLoading ? (
            <>
              {analysisResult ? (
                <Button variant="outline" onClick={onBackToImage}>
                  {" "}
                  画像表示に戻る{" "}
                </Button>
              ) : hasAnalyzedBefore ? (
                <Button onClick={onShowAnalysis}> 解析結果を表示 </Button>
              ) : (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                >
                  {" "}
                  解析{" "}
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" disabled>
              {isFetchingResult
                ? "取得中..."
                : isAnalyzing
                ? "解析中..."
                : "保存中..."}
              <Loader2 className="ml-2 w-4 h-4 animate-spin" />
            </Button>
          )}
        </div>
      </div>

      {/* --- 右矢印 --- */}
      <button
        onClick={onNext}
        disabled={selectedIndex === images.length - 1 || isLoading}
        className={`absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-opacity disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8 md:w-10 md:h-10"
        >
          {" "}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />{" "}
        </svg>
        <span className="sr-only">次の画像</span>
      </button>
    </div>
  );
};

export default ImageModal;
