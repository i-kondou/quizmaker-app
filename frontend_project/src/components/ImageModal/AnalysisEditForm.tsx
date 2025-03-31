// src/components/ImageModal/AnalysisEditForm.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { HeritageData } from "../../types"; // ../../types かも

interface AnalysisEditFormProps {
  editingData: HeritageData; // null ではない前提
  onDataChange: (data: HeritageData) => void; // 変更を親に通知
  onComplete: () => void; // 完了ボタン押下時
  onCancel: () => void; // キャンセルボタン押下時
  isSaving: boolean;
}

const AnalysisEditForm: React.FC<AnalysisEditFormProps> = ({
  editingData,
  onDataChange,
  onComplete,
  onCancel,
  isSaving,
}) => {
  return (
    <div className="space-y-2 p-2 bg-gray-50 rounded border">
      <div>
        <label className="block text-sm font-medium text-gray-700">名称:</label>
        <input
          type="text"
          value={editingData.title}
          onChange={(e) =>
            onDataChange({ ...editingData, title: e.target.value })
          }
          className="mt-1 block w-full border border-gray-300 rounded-md p-1 shadow-sm sm:text-sm"
          disabled={isSaving}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">説明:</label>
        <textarea
          value={editingData.description}
          onChange={(e) =>
            onDataChange({ ...editingData, description: e.target.value })
          }
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md p-1 shadow-sm sm:text-sm"
          disabled={isSaving}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          登録基準:
        </label>
        <input
          type="text"
          value={editingData.criteria.join(", ")}
          onChange={(e) => {
            const nums = e.target.value
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n) && n !== 0);
            onDataChange({ ...editingData, criteria: nums });
          }}
          className="mt-1 block w-full border border-gray-300 rounded-md p-1 shadow-sm sm:text-sm"
          disabled={isSaving}
        />
      </div>
      <div className="mt-3 flex justify-end space-x-2">
        <Button size="sm" onClick={onComplete} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "編集完了"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
};

export default AnalysisEditForm;
