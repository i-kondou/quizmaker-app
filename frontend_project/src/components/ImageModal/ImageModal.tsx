import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import AnalysisResultDisplay from "./AnalysisResultDisplay";
import {
  ImageData,
  HeritageData,
  HeritageResponse,
  ModalViewMode,
} from "../../types";

const BACKEND_URL = "http://localhost:8000";

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
  isSaving: boolean; // 編集保存中
  fetchError: string | null;
  hasAnalyzedBefore: boolean;
  onAnalyze: () => void;
  modalViewMode: ModalViewMode;
  onShowImage: () => void;
  onShowAnalysis: () => void;
  editingIndex: number | null;
  editingData: HeritageData | null;
  onEditStart: (index: number, data: HeritageData) => void;
  onEditChange: (data: HeritageData) => void;
  onEditComplete: () => void;
  onEditCancel: () => void;
  // accordionDefaultValue: string[]; // アコーディオンを使わないので不要
  // 問題作成用に追加
  generatingQuizId: number | null;
  onGenerateQuiz: (heritageId: number) => void;
  availableRegionTags: string[];
  availableFeatureTags: string[];
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
  modalViewMode,
  onShowImage,
  onShowAnalysis,
  editingIndex,
  editingData,
  onEditStart,
  onEditChange,
  onEditComplete,
  onEditCancel,
  // accordionDefaultValue, // 不要
  generatingQuizId,
  onGenerateQuiz,
  availableRegionTags,
  availableFeatureTags,
}) => {
  useEffect(() => {
    // モーダルが開いたときにクイズ生成状態をリセットする方が良いかも
    // if (!isOpen) {
    //   setGeneratingQuizIdInternal(null); // モーダル内で状態を持つ場合
    // }
  }, [isOpen]);

  if (!isOpen || selectedIndex < 0 || !images[selectedIndex]) {
    return null;
  }

  const currentImage = images[selectedIndex];
  // isSaving (編集保存中) も isLoading に含める
  const isLoading =
    isFetchingResult || isAnalyzing || isSaving || generatingQuizId !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      {" "}
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
      {/* --- モーダル本体 (幅を広げる) --- */}
      <div className="relative bg-white p-6 rounded shadow-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {" "}
        {/* max-w-6xl に変更 */}
        {/* --- 閉じるボタン --- */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`absolute top-3 right-3 z-[51] p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors disabled:opacity-50`}
          aria-label="閉じる"
        >
          {" "}
          <X className="w-5 h-5" />{" "}
        </button>
        {/* --- コンテンツエリア (Gridで2カラムに) --- */}
        <div className="flex-grow overflow-y-auto pt-4 pr-2 relative min-h-[400px]">
          {" "}
          {/* 高さを確保 */}
          {/* エラー表示 */}
          {fetchError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded text-center">
              {fetchError}
            </div>
          )}
          {/* データ取得中表示 */}
          {isFetchingResult && (
            <div className="flex flex-col justify-center items-center h-full">
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-gray-500" />
              <p className="mt-3 text-base md:text-lg font-semibold text-gray-600">
                データを取得中...
              </p>
            </div>
          )}
          {/* --- 解析結果がある場合は AnalysisResultDisplay を表示 --- */}
          {!isFetchingResult &&
            !fetchError && ( // 取得中でもエラーでもない場合
              <>
                {analysisResult && modalViewMode === "analysis" ? (
                  // 解析結果があり、解析結果表示モードの場合
                  <AnalysisResultDisplay
                    analysisResult={analysisResult}
                    editingIndex={editingIndex}
                    editingData={editingData}
                    onEditStart={onEditStart}
                    onEditChange={onEditChange}
                    onEditComplete={onEditComplete}
                    onEditCancel={onEditCancel}
                    isSaving={isSaving}
                    generatingQuizId={generatingQuizId}
                    onGenerateQuiz={onGenerateQuiz}
                    availableRegionTags={availableRegionTags}
                    availableFeatureTags={availableFeatureTags}
                  />
                ) : (
                  <div className="flex flex-col justify-center items-center w-full h-full relative">
                    {" "}
                    {/* relative追加 */}
                    {/* 画像 */}
                    <img
                      src={`${BACKEND_URL}/${currentImage.filename}`}
                      alt={`Selected ${currentImage.id}`}
                      className={`max-w-full w-full h-auto object-contain rounded ${
                        isAnalyzing ? "opacity-50" : ""
                      }`}
                      style={{ maxHeight: "calc(90vh - 15rem)" }} // 画像の高さを制限 (ヘッダ/フッタ分考慮)
                    />
                    {/* 解析中オーバーレイ */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 rounded">
                        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-blue-600" />
                        <p className="mt-3 text-base md:text-lg font-semibold text-blue-700">
                          解析中...
                        </p>
                      </div>
                    )}
                    {/* 解析ボタン (解析中でなく、解析済みフラグもfalseの場合) */}
                    {!isAnalyzing && !hasAnalyzedBefore && (
                      <div className="mt-4 text-center text-gray-600">
                        <p className="mb-2">まだ解析されていません。</p>
                        <Button onClick={onAnalyze} disabled={isAnalyzing}>
                          {isAnalyzing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "この画像を解析する"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
        </div>{" "}
        {/* End Content Area */}
        {/* --- 下部ボタン群 (モーダル全体のフッターとして配置) --- */}
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
          {/* ローディング中でない場合のみ、状況に応じたボタンを表示 */}
          {!isLoading && (
            <>
              {analysisResult ? ( // 解析結果が存在する場合
                modalViewMode === "analysis" ? (
                  // 解析結果表示中 => 「画像を表示」ボタン
                  <Button variant="outline" onClick={onShowImage}>
                    {" "}
                    画像を表示{" "}
                  </Button>
                ) : (
                  // 画像表示中 => 「解析結果を表示」ボタン
                  <Button variant="outline" onClick={onShowAnalysis}>
                    {" "}
                    解析結果を表示{" "}
                  </Button>
                )
              ) : (
                // 解析結果が存在しない場合
                !hasAnalyzedBefore && ( // まだ解析されたことがない場合のみ「解析」ボタン
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={onAnalyze}
                  >
                    {" "}
                    解析{" "}
                  </Button>
                )
              )}
            </>
          )}

          {/* ローディング中の表示 */}
          {isLoading && (
            <Button variant="outline" disabled>
              {isFetchingResult
                ? "取得中..."
                : isAnalyzing
                ? "解析中..."
                : isSaving
                ? "保存中..."
                : "問題生成中..."}
              <Loader2 className="ml-2 w-4 h-4 animate-spin" />
            </Button>
          )}
        </div>
      </div>{" "}
      {/* End Modal Body */}
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
