// src/App.tsx
import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import ImageUpload from "./components/ImageUpload";
import ImageList from "./components/ImageList";
import ImageModal from "./components/ImageModal";
import * as api from "./services/api";
import { ImageData, HeritageData, HeritageResponse } from "./types";
import "./App.css";

const App: React.FC = () => {
  // --- State定義 (Appコンポーネントで管理する主要なState) ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // モーダル表示用
  // --- モーダル関連のState (本来はImageModal内か、専用Hookが良い) ---
  const [analysisResult, setAnalysisResult] = useState<HeritageResponse | null>(
    null
  );
  const [accordionDefaultValue, setAccordionDefaultValue] = useState<string[]>(
    []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<HeritageData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isFetchingResult, setIsFetchingResult] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasAnalyzedBefore, setHasAnalyzedBefore] = useState<boolean>(false);
  const [fetchedDataCache, setFetchedDataCache] =
    useState<HeritageResponse | null>(null);

  // --- API呼び出し関数 (useCallbackでメモ化) ---
  const fetchImages = useCallback(async () => {
    try {
      const data = await api.fetchImagesAPI();
      setImages(data);
    } catch (error: any) {
      console.error("画像取得エラー:", error.message);
      // エラー表示 (例: トースト)
    }
  }, []);

  const fetchAnalysisResult = useCallback(async (imageId: number) => {
    setIsFetchingResult(true);
    setFetchError(null);
    setAnalysisResult(null);
    setAccordionDefaultValue([]);
    setHasAnalyzedBefore(false);
    setFetchedDataCache(null);
    try {
      const data = await api.fetchAnalysisResultAPI(imageId);
      if (data.content && data.content.length > 0) {
        setAnalysisResult(data);
        setFetchedDataCache(data);
        setAccordionDefaultValue(
          data.content.map((_, index) => `item-${index}`)
        );
        setHasAnalyzedBefore(true);
      } else {
        setHasAnalyzedBefore(false);
      }
    } catch (error: any) {
      console.error("解析結果取得エラー:", error.message);
      // 404かどうかなどを判定してエラー表示
      if (!error.message?.includes("404")) {
        setFetchError("解析結果の取得に失敗しました。");
      }
      setHasAnalyzedBefore(false);
    } finally {
      setIsFetchingResult(false);
    }
  }, []);

  // --- 初期データ読み込み ---
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // --- モーダル表示時のデータ読み込み ---
  useEffect(() => {
    if (selectedIndex !== null && images.length > selectedIndex) {
      fetchAnalysisResult(images[selectedIndex].id);
      setEditingIndex(null);
      setEditingData(null);
      setIsAnalyzing(false);
      setIsSaving(false);
    } else {
      // モーダル閉じるときのリセット
      setAnalysisResult(null);
      setAccordionDefaultValue([]);
      setFetchError(null);
      setHasAnalyzedBefore(false);
      setFetchedDataCache(null);
    }
  }, [selectedIndex, images, fetchAnalysisResult]); // 依存配列を修正

  // --- イベントハンドラー (API呼び出し部分を services/api を使うように変更) ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadLoading(true);
    try {
      await api.uploadImageAPI(selectedFile);
      await fetchImages(); // 再取得
      setSelectedFile(null);
    } catch (error: any) {
      console.error("アップロードエラー:", error.message);
      // エラー表示
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteModal = async () => {
    if (selectedIndex === null || isAnalyzing || isSaving || isFetchingResult)
      return;
    const imageId = images[selectedIndex].id;
    // ローディング開始など
    try {
      await api.deleteImageAPI(imageId);
      console.log("削除成功");
      setSelectedIndex(null); // モーダルを閉じる
      await fetchImages(); // 画像リスト再取得
    } catch (error: any) {
      console.error("削除エラー:", error.message);
      setFetchError("画像の削除に失敗しました。");
    } finally {
      // ローディング終了
    }
  };

  const handleAnalyzeAndSave = async () => {
    if (selectedIndex === null || isAnalyzing) return;
    const imageId = images[selectedIndex].id;
    setIsAnalyzing(true);
    setFetchError(null);
    try {
      // APIを呼び出し (レスポンスは使わない場合)
      await api.analyzeAndSaveHeritageAPI(imageId);
      console.log("解析＆DB保存/更新 成功");
      // 再取得して表示更新
      await fetchAnalysisResult(imageId);
    } catch (error: any) {
      console.error("解析エラー:", error.message);
      setFetchError("解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBackToImage = () => {
    setAnalysisResult(null);
    setAccordionDefaultValue([]);
    setEditingIndex(null);
    setEditingData(null);
  };

  const showAnalysisResultFromCache = () => {
    if (fetchedDataCache) {
      setAnalysisResult(fetchedDataCache);
      setAccordionDefaultValue(
        fetchedDataCache.content.map((_, idx) => `item-${idx}`)
      );
      setFetchError(null);
      setEditingIndex(null);
      setEditingData(null);
    } else if (selectedIndex !== null) {
      // フォールバック
      fetchAnalysisResult(images[selectedIndex].id);
    }
  };

  const prevImage = () => {
    if (
      selectedIndex !== null &&
      selectedIndex > 0 &&
      !(isAnalyzing || isSaving || isFetchingResult)
    ) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const nextImage = () => {
    if (
      selectedIndex !== null &&
      selectedIndex < images.length - 1 &&
      !(isAnalyzing || isSaving || isFetchingResult)
    ) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const handleEditStart = (index: number, data: HeritageData) => {
    setEditingIndex(index);
    setEditingData({ ...data });
  };

  const handleEditChange = (data: HeritageData) => {
    setEditingData(data);
  };

  const handleEditComplete = async (index: number) => {
    // index は使わないかも (editingData に基づくため)
    if (!editingData || selectedIndex === null || isSaving) return;
    const imageId = images[selectedIndex].id;
    const currentContent =
      fetchedDataCache?.content || analysisResult?.content || [];
    const newContent = currentContent.map((item, idx) =>
      idx === editingIndex ? editingData : item
    );
    const updatedAnalysisData: HeritageResponse = { content: newContent };

    setIsSaving(true);
    setFetchError(null);
    try {
      const savedData = await api.updateHeritageAPI(
        imageId,
        updatedAnalysisData
      );
      console.log("編集内容のDB保存成功", savedData);
      setAnalysisResult(savedData);
      setFetchedDataCache(savedData); // キャッシュも更新
      setAccordionDefaultValue(
        savedData.content.map((_, idx) => `item-${idx}`)
      );
      setEditingIndex(null);
      setEditingData(null);
    } catch (error: any) {
      console.error("編集内容の保存エラー:", error.message);
      setFetchError("編集内容の保存中にエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingData(null);
  };

  // --- レンダリング ---
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">画像管理</h1>

      {/* 画像アップロードコンポーネント */}
      <ImageUpload
        selectedFile={selectedFile}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        isLoading={uploadLoading}
      />

      {/* 画像一覧コンポーネント */}
      <ImageList
        images={images}
        onImageClick={setSelectedIndex} // indexを渡してselectedIndexを更新
        disabled={
          isAnalyzing || isSaving || isFetchingResult || selectedIndex !== null
        } // モーダル表示中や処理中は無効化
      />

      {/* 画像モーダルコンポーネント */}
      <ImageModal
        isOpen={selectedIndex !== null}
        onClose={closeModal}
        images={images}
        selectedIndex={selectedIndex ?? -1} // nullでないことを保証 or isOpenで制御
        onPrev={prevImage}
        onNext={nextImage}
        onDelete={handleDeleteModal}
        analysisResult={analysisResult}
        isFetchingResult={isFetchingResult}
        isAnalyzing={isAnalyzing}
        isSaving={isSaving}
        fetchError={fetchError}
        hasAnalyzedBefore={hasAnalyzedBefore}
        onAnalyze={handleAnalyzeAndSave}
        onShowAnalysis={showAnalysisResultFromCache}
        onBackToImage={handleBackToImage}
        editingIndex={editingIndex}
        editingData={editingData}
        onEditStart={handleEditStart}
        onEditChange={handleEditChange} // 編集フォームコンポーネントに渡す
        onEditComplete={handleEditComplete}
        onEditCancel={handleEditCancel}
        accordionDefaultValue={accordionDefaultValue}
      />
    </div>
  );
};

export default App;
