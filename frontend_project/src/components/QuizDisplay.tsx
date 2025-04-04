import React from "react";
import { Button } from "@/components/ui/button";
import { QuizData } from "../types";
import { Loader2 } from "lucide-react";
import QuizEditForm from "./QuizEditForm";

interface QuizDisplayProps {
  quizzes: QuizData[];
  isLoading?: boolean;
  // --- 編集関連 Props を追加 ---
  editingQuizId: number | null;
  currentQuizEditData: QuizData | null; // 編集フォーム用のデータ
  onEditQuizStart: (quiz: QuizData) => void;
  onQuizDataChange: (data: QuizData) => void;
  onQuizSave: () => void;
  onQuizCancel: () => void;
  isSavingQuiz: boolean; // クイズ保存中フラグ
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({
  quizzes,
  isLoading,
  // --- Props を受け取る ---
  editingQuizId,
  currentQuizEditData,
  onEditQuizStart,
  onQuizDataChange,
  onQuizSave,
  onQuizCancel,
  isSavingQuiz,
}) => {
  if (isLoading) {
    return (
      <div className="text-center p-4">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />{" "}
        クイズを読み込み中...
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <p className="text-center text-gray-500 p-4">
        表示できるクイズがありません。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">生成されたクイズ</h3>
      {quizzes.map((quiz, index) => (
        <div key={quiz.id}>
          {/* --- 編集中かどうかの判定 --- */}
          {editingQuizId === quiz.id && currentQuizEditData ? (
            // --- 編集フォームを表示 ---
            <QuizEditForm
              editingQuizData={currentQuizEditData}
              onDataChange={onQuizDataChange}
              onSave={onQuizSave}
              onCancel={onQuizCancel}
              isSaving={isSavingQuiz}
            />
          ) : (
            // --- 通常表示 ---
            <div className="p-4 border rounded bg-gray-50 text-sm relative group">
              {" "}
              {/* group クラス追加 */}
              {/* 編集ボタン (右上に表示) */}
              {editingQuizId === null && ( // 他のクイズ編集中は非表示
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 px-2 py-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity" // ホバーで表示
                  onClick={() => onEditQuizStart(quiz)}
                  disabled={isSavingQuiz} // 保存中は非活性
                >
                  編集
                </Button>
              )}
              <p className="font-medium mb-2">問題 {index + 1}:</p>
              <p className="whitespace-pre-wrap mb-3">{quiz.question}</p>
              <ul className="space-y-1 list-disc list-inside pl-2 mb-3">
                {quiz.options.map((option, oIndex) => (
                  <li key={oIndex}>{option}</li>
                ))}
              </ul>
              <p>
                <strong className="text-green-700">正解:</strong> {quiz.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuizDisplay;
