import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Cardを使用
import { Loader2 } from "lucide-react";
import AnalysisEditForm from "./AnalysisEditForm"; // 編集フォームをインポート
import { HeritageData, HeritageResponse } from "../../types"; // 更新された型定義
import { toRomanNumeral } from "../../utils/helpers"; // ローマ数字変換

interface AnalysisResultDisplayProps {
  analysisResult: HeritageResponse; // null ではない前提
  editingIndex: number | null; // どの項目を編集中か (UI表示用 index)
  editingData: HeritageData | null; // 編集中のデータ (id含む)
  onEditStart: (index: number, data: HeritageData) => void;
  onEditChange: (data: HeritageData) => void;
  onEditComplete: () => void;
  onEditCancel: () => void;
  isSaving: boolean;
  // 問題作成用 (今回はボタン表示のみ)
  generatingQuizId: number | null; // どの項目のクイズを生成中か
  onGenerateQuiz: (heritageId: number) => void;
  availableRegionTags: string[]; // 利用可能な地域タグ
  availableFeatureTags: string[]; // 利用可能な特徴タグ
}

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({
  analysisResult,
  editingIndex,
  editingData,
  onEditStart,
  onEditChange,
  onEditComplete,
  onEditCancel,
  isSaving,
  generatingQuizId,
  onGenerateQuiz,
  availableRegionTags,
  availableFeatureTags,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-4">
        解析結果
      </h2>
      {analysisResult.content.map((item, idx) => (
        <Card key={item.id} className="overflow-hidden">
          {editingIndex === idx && editingData ? (
            // --- 編集フォーム表示 ---
            <div className="p-4 bg-yellow-50">
              <h3 className="text-lg font-semibold mb-2">
                編集モード: {item.title}
              </h3>
              <AnalysisEditForm
                editingData={editingData}
                onDataChange={onEditChange}
                onComplete={onEditComplete}
                onCancel={onEditCancel}
                isSaving={isSaving}
                availableRegionTags={availableRegionTags}
                availableFeatureTags={availableFeatureTags}
              />
            </div>
          ) : (
            // --- 通常表示 ---
            <>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  {/* 編集・問題作成ボタン */}
                  {editingIndex === null && ( // 他の項目を編集中はボタン非表示
                    <div className="flex space-x-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditStart(idx, item)}
                        disabled={isSaving || generatingQuizId === item.id}
                      >
                        編集
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onGenerateQuiz(item.id)}
                        disabled={isSaving || generatingQuizId === item.id}
                      >
                        {generatingQuizId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "問題作成"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {/* 国名と基準 */}
                <CardDescription className="text-sm text-gray-600 pt-1">
                  {item.country && item.country.length > 0 && (
                    <span>国: {item.country.join(", ")}</span>
                  )}
                  {item.criteria && item.criteria.length > 0 && (
                    <span className="ml-2">
                      (基準: {item.criteria.map(toRomanNumeral).join(", ")})
                    </span>
                  )}
                  {item.unesco_tag && (
                    <span className="ml-2 font-medium">
                      [{item.unesco_tag}]
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {/* 各フィールドを表示 */}
                {item.summary && (
                  <p>
                    <strong>要約:</strong> {item.summary}
                  </p>
                )}
                {item.simple_summary && item.simple_summary.length > 0 && (
                  <div>
                    <strong>ポイント:</strong>
                    <ul className="list-disc list-inside pl-2">
                      {item.simple_summary.map((point, pIdx) => (
                        <li key={pIdx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.description && (
                  <p className="whitespace-pre-wrap">
                    <strong>説明:</strong> {item.description}
                  </p>
                )}
                {/* タグ情報 */}
                {(item.region || item.feature) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.region?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.feature?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      ))}
    </div>
  );
};

export default AnalysisResultDisplay;
