import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { QuizData } from "../types";

interface QuizEditFormProps {
  editingQuizData: QuizData;
  onDataChange: (data: QuizData) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

const QuizEditForm: React.FC<QuizEditFormProps> = ({
  editingQuizData,
  onDataChange,
  onSave,
  onCancel,
  isSaving,
}) => {
  // 選択肢を改行区切りで表示・編集
  const optionsString = editingQuizData.options?.join("\n") ?? "";

  const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newOptions = e.target.value
      .split("\n")
      .map((s) => s.trim()) // 前後の空白削除
      .filter((s) => s); // 空行を除去
    onDataChange({ ...editingQuizData, options: newOptions });
  };

  return (
    <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h4 className="font-semibold text-base mb-2">クイズ編集</h4>
      <div>
        <Label
          htmlFor={`quiz-edit-q-${editingQuizData.id}`}
          className="text-sm font-medium"
        >
          問題文:
        </Label>
        <Textarea
          id={`quiz-edit-q-${editingQuizData.id}`}
          value={editingQuizData.question}
          onChange={(e) =>
            onDataChange({ ...editingQuizData, question: e.target.value })
          }
          rows={3}
          className="mt-1 bg-white"
          disabled={isSaving}
        />
      </div>
      <div>
        <Label
          htmlFor={`quiz-edit-o-${editingQuizData.id}`}
          className="text-sm font-medium"
        >
          選択肢 (改行区切り):
        </Label>
        <Textarea
          id={`quiz-edit-o-${editingQuizData.id}`}
          value={optionsString}
          onChange={handleOptionsChange}
          rows={4}
          className="mt-1 bg-white"
          disabled={isSaving}
          placeholder="選択肢1&#10;選択肢2&#10;選択肢3&#10;選択肢4" // &#10; は改行
        />
      </div>
      <div>
        <Label
          htmlFor={`quiz-edit-a-${editingQuizData.id}`}
          className="text-sm font-medium"
        >
          正解 (選択肢と完全に一致):
        </Label>
        <Input
          id={`quiz-edit-a-${editingQuizData.id}`}
          type="text"
          value={editingQuizData.answer}
          onChange={(e) =>
            onDataChange({ ...editingQuizData, answer: e.target.value })
          }
          className="mt-1 bg-white"
          disabled={isSaving}
        />
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          キャンセル
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存"}
        </Button>
      </div>
    </div>
  );
};

export default QuizEditForm;
