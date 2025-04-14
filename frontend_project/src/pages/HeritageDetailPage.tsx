import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { HeritageData, DetailViewMode, QuizData } from "../types";
import {
  fetchHeritageDetailAPI,
  updateSingleHeritageAPI,
  generateQuizAPI,
  fetchQuizzesByHeritageIdAPI,
  updateSingleQuizAPI,
} from "../services/api";
import { toRomanNumeral } from "../utils/helpers";
import QuizDisplay from "../components/QuizDisplay";
import { REGION_TAGS, FEATURE_TAGS } from "../../constants";

interface HeritageWithId extends HeritageData {
  id: number;
}

const HeritageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const heritageId = Number(id);
  const navigate = useNavigate();

  // --- State定義 ---
  const [heritage, setHeritage] = useState<HeritageWithId | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 編集用state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<HeritageData | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // クイズ関連State
  const [quizzes, setQuizzes] = useState<QuizData[] | null>(null);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  // クイズ編集用State
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [currentQuizEditData, setCurrentQuizEditData] =
    useState<QuizData | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState<boolean>(false);
  // 表示モード
  const [detailViewMode, setDetailViewMode] =
    useState<DetailViewMode>("detailsOnly");

  // --- データ取得 ---
  const fetchDate = useCallback(async () => {
    if (!heritageId || isNaN(heritageId)) {
      setError("無効なIDです。");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setIsLoadingQuizzes(true);
    setError(null);
    setQuizError(null);
    setQuizzes(null);
    setDetailViewMode("detailsOnly");

    let heritageData: HeritageWithId | null = null;
    let quizData: QuizData[] | [];

    try {
      heritageData = await fetchHeritageDetailAPI(heritageId);
      setHeritage(heritageData);
    } catch (err: any) {
      setError(err.message || "データの取得に失敗しました");
      setIsLoading(false);
      setIsLoadingQuizzes(false);
      return;
    } finally {
      setIsLoading(false);
    }

    try {
      quizData = await fetchQuizzesByHeritageIdAPI(heritageId);
      setQuizzes(quizData);
    } catch (err: any) {
      if (err.message?.includes("(Status: 404)")) {
        setQuizzes([]);
      } else {
        setQuizError(`クイズの取得に失敗しました: ${err.message}`);
        setQuizzes([]);
      }
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [heritageId]);

  useEffect(() => {
    fetchDate();
  }, [fetchDate]);

  // --- 編集関連ハンドラ ---
  const handleEditToggle = () => {
    if (!isEditing && heritage) {
      setEditedData({ ...heritage });
    } else {
      setEditedData(null);
    }
    setIsEditing(!isEditing);
    setError(null);
  };
  const handleEditDataChange = (
    field: keyof Omit<HeritageData, "id">,
    value: string | number[] | string[] | null
  ) => {
    setEditedData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleTagChange = (
    tagType: "region" | "feature",
    tag: string,
    isChecked: boolean | "indeterminate"
  ) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const currentTags = new Set(prev[tagType] ?? []);
      if (isChecked === true) {
        currentTags.add(tag);
      } else {
        currentTags.delete(tag);
      }
      return { ...prev, [tagType]: Array.from(currentTags) };
    });
  };

  // 保存処理
  const handleSave = async () => {
    if (!editedData || !heritageId) return;
    setIsSaving(true);
    setError(null);
    try {
      const dataToSave: Omit<HeritageData, "id"> = {
        title: editedData.title,
        description: editedData.description,
        summary: editedData.summary,
        simple_summary: editedData.simple_summary,
        criteria: editedData.criteria,
        unesco_tag: editedData.unesco_tag,
        country: editedData.country,
        region: editedData.region,
        feature: editedData.feature,
      };
      const updatedHeritage = await updateSingleHeritageAPI(
        heritageId,
        dataToSave
      );
      setHeritage(updatedHeritage);
      setIsEditing(false);
      setEditedData(null);
    } catch (err: any) {
      setError(err.message || "更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 問題作成ハンドラ ---
  const handleGenerateQuiz = async () => {
    if (!heritageId || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    setQuizError(null);
    try {
      const generatedQuizResponse = await generateQuizAPI(heritageId);
      console.log("Generated Quiz:", generatedQuizResponse);
      setIsLoadingQuizzes(true);
      const updatedQuizzes = await fetchQuizzesByHeritageIdAPI(heritageId);
      setQuizzes(updatedQuizzes || []);
      setDetailViewMode("detailsAndQuiz");
    } catch (err: any) {
      setQuizError(err.message || "問題作成に失敗しました");
    } finally {
      setIsGeneratingQuiz(false);
      setIsLoadingQuizzes(false);
    }
  };

  // --- 表示モード切替ハンドラ ---
  const handleViewQuizClick = () => {
    setDetailViewMode("detailsAndQuiz");
    if (quizzes === null) {
      fetchQuizzesByHeritageIdAPI(heritageId).then(setQuizzes);
    }
  };
  const handleViewDetailsOnlyClick = () => {
    setDetailViewMode("detailsOnly");
  };

  // --- クイズ編集関連ハンドラ  ---
  const handleEditQuizStart = (quiz: QuizData) => {
    console.log("Starting to edit quiz:", quiz);
    setEditingQuizId(quiz.id);
    setCurrentQuizEditData({ ...quiz });
    setQuizError(null);
  };

  const handleQuizDataChange = (data: QuizData) => {
    setCurrentQuizEditData(data);
  };

  const handleQuizCancel = () => {
    console.log("Canceling quiz edit");
    setEditingQuizId(null);
    setCurrentQuizEditData(null);
  };

  const handleQuizSave = async () => {
    if (!currentQuizEditData || !editingQuizId || isSavingQuiz) return;
    console.log("Saving quiz:", currentQuizEditData);
    setIsSavingQuiz(true);
    setQuizError(null);

    const dataToSave: Omit<QuizData, "id" | "heritage_id"> = {
      question: currentQuizEditData.question,
      options: currentQuizEditData.options,
      answer: currentQuizEditData.answer,
    };

    try {
      const updatedQuiz = await updateSingleQuizAPI(editingQuizId, dataToSave);
      console.log("Quiz updated successfully:", updatedQuiz);

      setQuizzes((prev) =>
        prev
          ? prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q))
          : null
      );

      setEditingQuizId(null);
      setCurrentQuizEditData(null);
    } catch (err: any) {
      console.error("Error saving quiz:", err);
      setQuizError(`クイズの保存に失敗しました: ${err.message}`);
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // --- レンダリング ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  if (!heritage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">データが見つかりません。</p>
      </div>
    );
  }

  // 編集フォーム用の値 (nullチェック)
  const currentEditData = isEditing ? editedData : heritage;
  const descriptionValue =
    (isEditing ? editedData?.description : heritage?.description) ?? "";
  const summaryValue =
    (isEditing ? editedData?.summary : heritage?.summary) ?? "";
  const simpleSummaryValue =
    (isEditing
      ? editedData?.simple_summary?.join("\n")
      : heritage?.simple_summary?.join("\n")) ?? "";
  const criteriaValue =
    (isEditing
      ? editedData?.criteria?.join(", ")
      : heritage?.criteria?.join(", ")) ?? "";
  const countryValue =
    (isEditing
      ? editedData?.country?.join(", ")
      : heritage?.country?.join(", ")) ?? "";
  const currentRegionTags = new Set(
    (isEditing ? editedData?.region : heritage?.region) ?? []
  ); // area or region
  const currentFeatureTags = new Set(
    (isEditing ? editedData?.feature : heritage?.feature) ?? []
  );

  return (
    <div className="container mx-auto p-4">
      <Button
        variant="outline"
        onClick={() => navigate("/heritages")}
        className="mb-4"
      >
        ← 一覧に戻る
      </Button>

      <div
        className={`grid grid-cols-1 ${
          detailViewMode === "detailsAndQuiz" ? "md:grid-cols-2" : ""
        } gap-6`}
      >
        <Card>
          <CardHeader>
            {isEditing && currentEditData ? (
              // --- 編集: タイトル ---
              <div>
                {" "}
                <Label htmlFor="edit-title">名称:</Label>{" "}
                <Input
                  id="edit-title"
                  value={currentEditData.title}
                  onChange={(e) =>
                    handleEditDataChange("title", e.target.value)
                  }
                  className="text-2xl font-bold mt-1"
                  disabled={isSaving}
                />{" "}
              </div>
            ) : (
              // --- 表示: タイトル ---
              <CardTitle className="text-3xl">{heritage.title}</CardTitle>
            )}
            {/* --- 表示/編集: 国、基準、UNESCOタグ --- */}
            <CardDescription className="text-base text-gray-600 pt-2 space-y-1">
              {/* 国名 */}
              <div>
                <Label className="text-sm font-medium">国:</Label>
                {isEditing && currentEditData ? (
                  <Input
                    id="edit-country"
                    type="text"
                    value={countryValue}
                    onChange={(e) => {
                      const countries = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s !== "");
                      handleEditDataChange(
                        "country",
                        countries.length > 0 ? countries : null
                      );
                    }}
                    disabled={isSaving}
                    className="mt-1 text-sm"
                    placeholder="例: 日本, イタリア"
                  />
                ) : (
                  <span className="ml-1">
                    {heritage.country?.join(", ") || "N/A"}
                  </span>
                )}
              </div>
              {/* 基準 */}
              <div>
                <Label className="text-sm font-medium">登録基準:</Label>
                {isEditing && currentEditData ? (
                  <Input
                    id="edit-criteria"
                    type="text"
                    value={criteriaValue}
                    onChange={(e) => {
                      const nums = e.target.value
                        .split(",")
                        .map((s) => Number(s.trim()))
                        .filter((n) => !isNaN(n) && n > 0);
                      handleEditDataChange(
                        "criteria",
                        nums.length > 0 ? nums : null
                      );
                    }}
                    disabled={isSaving}
                    className="mt-1 text-sm"
                    placeholder="例: 1, 4, 6"
                  />
                ) : (
                  <span className="ml-1">
                    {heritage.criteria?.map(toRomanNumeral).join(", ") || "N/A"}
                  </span>
                )}
              </div>
              {/* UNESCOタグ (編集不可、表示のみ) */}
              {heritage.unesco_tag && !isEditing && (
                <div>
                  <Label className="text-sm font-medium">分類:</Label>
                  <span className="ml-1 font-medium">
                    [{heritage.unesco_tag}]
                  </span>
                </div>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {" "}
            {/* --- 表示/編集: 要約 --- */}
            <div>
              <Label htmlFor="edit-summary" className="text-sm font-medium">
                要約:
              </Label>
              {isEditing && currentEditData ? (
                <Textarea
                  id="edit-summary"
                  value={summaryValue}
                  onChange={(e) =>
                    handleEditDataChange("summary", e.target.value || null)
                  }
                  rows={2}
                  className="mt-1"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-sm text-gray-800 mt-1">
                  {heritage.summary || "N/A"}
                </p>
              )}
            </div>
            {/* --- 表示/編集: 3点要約 --- */}
            <div>
              <Label
                htmlFor="edit-simple_summary"
                className="text-sm font-medium"
              >
                3点要約:
              </Label>
              {isEditing && currentEditData ? (
                <Textarea
                  id="edit-simple_summary"
                  value={simpleSummaryValue}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter((s) => s !== "");
                    handleEditDataChange(
                      "simple_summary",
                      lines.length > 0 ? lines : null
                    );
                  }}
                  rows={3}
                  className="mt-1"
                  disabled={isSaving}
                  placeholder="1行目...\n2行目...\n3行目..."
                />
              ) : heritage.simple_summary &&
                heritage.simple_summary.length > 0 ? (
                <ul className="list-disc list-inside pl-2 text-sm text-gray-800 mt-1">
                  {heritage.simple_summary.map((point, pIdx) => (
                    <li key={pIdx}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 mt-1">N/A</p>
              )}
            </div>
            {/* --- 表示/編集: 説明 --- */}
            <div>
              <Label htmlFor="edit-desc" className="text-sm font-medium">
                説明:
              </Label>
              {isEditing && currentEditData ? (
                <Textarea
                  id="edit-desc"
                  value={descriptionValue}
                  onChange={(e) =>
                    handleEditDataChange("description", e.target.value || null)
                  }
                  rows={6}
                  className="mt-1"
                  disabled={isSaving}
                />
              ) : (
                <p className="whitespace-pre-wrap text-gray-800 mt-1">
                  {heritage.description || "説明なし"}
                </p>
              )}
            </div>
            {/* --- 表示/編集: 地域(Region)タグ --- */}
            <div>
              <Label className="text-sm font-medium mb-1 block">地域:</Label>
              {isEditing && currentEditData ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 p-2 border rounded bg-white mt-1">
                  {REGION_TAGS.map((tag) => (
                    <div
                      key={`region-${tag}`}
                      className="flex items-center space-x-1"
                    >
                      <Checkbox
                        id={`edit-region-${tag}`}
                        checked={currentRegionTags.has(tag)}
                        onCheckedChange={(checked) =>
                          handleTagChange("region", tag, checked)
                        }
                        disabled={isSaving}
                      />
                      <Label
                        htmlFor={`edit-region-${tag}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {heritage?.region?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {(!heritage?.region || heritage.region.length === 0) && (
                    <span className="text-xs text-gray-500">N/A</span>
                  )}
                </div>
              )}
            </div>
            {/* --- 表示/編集: 特徴(Feature)タグ --- */}
            <div>
              <Label className="text-sm font-medium mb-1 block">特徴:</Label>
              {isEditing && currentEditData ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 p-2 border rounded bg-white mt-1">
                  {FEATURE_TAGS.map((tag) => (
                    <div
                      key={`feature-${tag}`}
                      className="flex items-center space-x-1"
                    >
                      <Checkbox
                        id={`edit-feature-${tag}`}
                        checked={currentFeatureTags.has(tag)}
                        onCheckedChange={(checked) =>
                          handleTagChange("feature", tag, checked)
                        }
                        disabled={isSaving}
                      />
                      <Label
                        htmlFor={`edit-feature-${tag}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {heritage.feature?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {(!heritage.feature || heritage.feature.length === 0) && (
                    <span className="text-xs text-gray-500">N/A</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4">
            {/* --- 編集ボタン / 保存・キャンセルボタン --- */}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {" "}
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "保存"
                    )}{" "}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEditToggle}
                    disabled={isSaving}
                  >
                    キャンセル
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleEditToggle}>
                  編集
                </Button>
              )}
            </div>

            {/* --- 問題作成ボタン --- */}
            {!isEditing}
          </CardFooter>
        </Card>

        {/* --- 右カラム: クイズ表示 (モードが detailsAndQuiz の場合のみ) --- */}
        {detailViewMode === "detailsAndQuiz" && (
          <div className="space-y-4">
            {/* QuizDisplay に編集関連の Props を渡す */}
            <QuizDisplay
              quizzes={quizzes || []}
              isLoading={isLoadingQuizzes}
              editingQuizId={editingQuizId}
              currentQuizEditData={currentQuizEditData}
              onEditQuizStart={handleEditQuizStart}
              onQuizDataChange={handleQuizDataChange}
              onQuizSave={handleQuizSave}
              onQuizCancel={handleQuizCancel}
              isSavingQuiz={isSavingQuiz} // isSaving -> isSavingQuiz に変更
            />
            {/* クイズ取得/保存エラー表示 */}
            {quizError && (
              <p className="text-red-600 text-sm mt-2">{quizError}</p>
            )}
          </div>
        )}
      </div>
      {/* --- 下部: クイズ生成/表示切替ボタン --- */}
      <div className="mt-6 pt-4 border-t flex items-center space-x-2">
        {!isEditing && ( // 編集中は表示しない
          <>
            {quizzes === null && isLoadingQuizzes ? (
              <Button variant="outline" disabled>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                クイズ情報確認中...
              </Button>
            ) : quizzes && quizzes.length > 0 ? (
              // クイズが存在する場合
              detailViewMode === "detailsOnly" ? (
                <Button onClick={handleViewQuizClick}>クイズを見る</Button>
              ) : (
                <Button variant="outline" onClick={handleViewDetailsOnlyClick}>
                  詳細のみ表示
                </Button>
              )
            ) : (
              // クイズが存在しない場合
              <Button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}>
                {isGeneratingQuiz ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isGeneratingQuiz ? "問題を生成中..." : "問題を作成"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HeritageDetailPage;
