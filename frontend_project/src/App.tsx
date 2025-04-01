// src/App.tsx
import React, { useState, useEffect, ChangeEvent, useCallback } from "react";
import ImageUpload from "./components/ImageUpload";
import ImageList from "./components/ImageList";
import ImageModal from "./components/ImageModal/ImageModal";
import * as api from "./services/api";
import {
  ImageData,
  HeritageData,
  HeritageResponse,
  ModalViewMode,
} from "./types";
import "./App.css";

const REGION_TAGS: string[] = [
  "アジア",
  "ヨーロッパ",
  "アフリカ",
  "北アメリカ",
  "南アメリカ",
  "オセアニア",
  // 必要なら他の地域も追加 (例: "東アジア", "西ヨーロッパ"...)
];

const FEATURE_TAGS: string[] = [
  "宗教建築",
  "キリスト教建築",
  "イスラム建築",
  "仏教建築",
  "ヒンドゥー教建築",
  "神社建築",
  "その他宗教建築",
  "宮殿・邸宅",
  "城郭・要塞",
  "遺跡・考古学的遺跡",
  "歴史的都市・集落",
  "文化的景観",
  "産業遺産",
  "交通遺産",
  "庭園・公園",
  "古墳・墓所",
  "記念建造物",
  "岩絵・壁画",
  "負の遺産",
  "山岳・山脈",
  "火山・火山地形",
  "森林",
  "砂漠",
  "河川・湖沼",
  "湿地・湿原",
  "氷河・氷床・フィヨルド",
  "海岸・崖",
  "島嶼",
  "海洋生態系",
  "サンゴ礁",
  "カルスト地形・洞窟",
  "滝",
  "特殊な地形・地質",
  "化石産地",
  "国立公園・自然保護区",
];

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
  const [generatingQuizId, setGeneratingQuizId] = useState<number | null>(null);
  const [generatedQuizData, setGeneratedQuizData] = useState<any>(null);
  const [modalViewMode, setModalViewMode] = useState<ModalViewMode>("image");

  // --- API呼び出し関数 (useCallbackでメモ化) ---
  const fetchImages = useCallback(async () => {
    try {
      const data = await api.fetchImagesAPI();
      setImages(data);
    } catch (error: any) {
      console.error("画像取得エラー:", error.message);
    }
  }, []);

  const fetchAnalysisResult = useCallback(async (imageId: number) => {
    setIsFetchingResult(true);
    setFetchError(null);
    setAnalysisResult(null);
    setAccordionDefaultValue([]);
    setHasAnalyzedBefore(false);
    setFetchedDataCache(null);
    setModalViewMode("image");
    try {
      const data = await api.fetchAnalysisResultAPI(imageId);
      console.log(
        "App.tsx: Raw data received from fetchAnalysisResultAPI:",
        JSON.stringify(data, null, 2)
      );
      if (data.content && data.content.length > 0) {
        console.log("App.tsx: Content found, setting hasAnalyzedBefore=true");
        setAnalysisResult(data);
        setFetchedDataCache(data);
        setAccordionDefaultValue(
          data.content.map((_, index) => `item-${index}`)
        );
        setHasAnalyzedBefore(true);
        setModalViewMode("analysis");
      } else {
        console.log(
          "App.tsx: No content found, setting hasAnalyzedBefore=false"
        );
        setHasAnalyzedBefore(false);
        setModalViewMode("image");
      }
    } catch (error: any) {
      console.error("App.tsx: Error in fetchAnalysisResult:", error.message);
      if (!error.message?.includes("404")) {
        setFetchError("解析結果の取得に失敗しました。");
      }
      setHasAnalyzedBefore(false);
    } finally {
      console.log("App.tsx: Setting isFetchingResult=false");
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
      setGeneratedQuizData(null);
      setGeneratingQuizId(null);
    } else {
      // モーダル閉じるときのリセット
      setAnalysisResult(null);
      setAccordionDefaultValue([]);
      setFetchError(null);
      setHasAnalyzedBefore(false);
      setFetchedDataCache(null);
      setModalViewMode("image");
      setEditingIndex(null);
      setEditingData(null);
      setIsSaving(false);
      setGeneratedQuizData(null);
      setGeneratingQuizId(null);
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
    setModalViewMode("image");
    try {
      await api.analyzeAndSaveHeritageAPI(imageId);
      console.log("解析＆DB保存/更新 成功");
      await fetchAnalysisResult(imageId);
    } catch (error: any) {
      console.error("解析エラー:", error.message);
      setFetchError("解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowImageInModal = () => {
    console.log("App.tsx: Setting modalViewMode to 'image'");
    setModalViewMode("image");
    setEditingIndex(null);
    setEditingData(null);
  };
  const handleShowAnalysisInModal = () => {
    console.log("App.tsx: Setting modalViewMode to 'analysis'");
    setModalViewMode("analysis");
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

  const handleEditComplete = async () => {
    if (!editingData || !editingData.id || isSaving) return;
    const heritageId = editingData.id;
    const dataToUpdate: Omit<HeritageData, "id"> = {
      title: editingData.title,
      description: editingData.description,
      summary: editingData.summary,
      simple_summary: editingData.simple_summary,
      criteria: editingData.criteria,
      unesco_tag: editingData.unesco_tag,
      country: editingData.country,
      region: editingData.region,
      feature: editingData.feature,
    };

    setIsSaving(true);
    setFetchError(null);
    try {
      const updatedHeritage = await api.updateSingleHeritageAPI(
        heritageId,
        dataToUpdate
      );
      console.log("編集内容のDB保存成功", updatedHeritage);
      const updateState = (
        prev: HeritageResponse | null
      ): HeritageResponse | null => {
        if (!prev) return null;
        // content 配列から該当idの要素を更新後のデータで置き換える
        const newContent = prev.content.map((item) =>
          item.id === updatedHeritage.id ? updatedHeritage : item
        );
        return { ...prev, content: newContent };
      };
      setAnalysisResult(updateState);
      setFetchedDataCache(updateState);
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

  const handleGenerateQuiz = async (heritageId: number) => {
    console.log(`App.tsx: handleGenerateQuiz called for ID: ${heritageId}`);
    if (generatingQuizId !== null) return; // すでに生成中なら何もしない

    setGeneratingQuizId(heritageId); // 生成開始状態にする
    setFetchError(null);
    setGeneratedQuizData(null); // 前回の結果をクリア

    try {
      console.log("App.tsx: Calling generateQuizAPI...");
      const quizData = await api.generateQuizAPI(heritageId);
      console.log("App.tsx: Quiz generation successful:", quizData);
      setGeneratedQuizData(quizData); // 生成されたクイズデータをstateに保存
      // 必要であればここでユーザーに通知 (例: alert, toast)
      alert("問題を作成しました！(内容はコンソールまたは表示エリアを確認)");
    } catch (error: any) {
      console.error("App.tsx: Error during quiz generation:", error);
      setFetchError(`問題の作成中にエラーが発生しました: ${error.message}`);
    } finally {
      console.log("App.tsx: Setting generatingQuizId=null");
      setGeneratingQuizId(null); // 生成終了状態にする
    }
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
        modalViewMode={modalViewMode}
        onShowImage={handleShowImageInModal}
        onShowAnalysis={handleShowAnalysisInModal}
        editingIndex={editingIndex}
        editingData={editingData}
        onEditStart={handleEditStart}
        onEditChange={handleEditChange} // 編集フォームコンポーネントに渡す
        onEditComplete={handleEditComplete}
        onEditCancel={handleEditCancel}
        generatingQuizId={generatingQuizId} // <<< 追加
        onGenerateQuiz={handleGenerateQuiz}
        availableRegionTags={REGION_TAGS}
        availableFeatureTags={FEATURE_TAGS}
      />
    </div>
  );
};

export default App;
