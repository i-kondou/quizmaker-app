import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { HeritageData } from "../../types";

interface AnalysisEditFormProps {
  editingData: HeritageData;
  onDataChange: (data: HeritageData) => void;
  onComplete: () => void;
  onCancel: () => void;
  isSaving: boolean;
  availableRegionTags: string[];
  availableFeatureTags: string[];
}

const AnalysisEditForm: React.FC<AnalysisEditFormProps> = ({
  editingData,
  onDataChange,
  onComplete,
  onCancel,
  isSaving,
  availableRegionTags,
  availableFeatureTags,
}) => {
  // --- デフォルト値設定 ---
  const descriptionValue = editingData.description ?? "";
  const summaryValue = editingData.summary ?? "";
  const simpleSummaryValue = editingData.simple_summary?.join("\n") ?? "";
  const criteriaValue = editingData.criteria?.join(", ") ?? "";
  const countryValue = editingData.country?.join(", ") ?? "";
  const currentRegionTags = new Set(editingData.region ?? []);
  const currentFeatureTags = new Set(editingData.feature ?? []);

  const handleTagChange = (
    tagType: "region" | "feature",
    tag: string,
    isChecked: boolean | "indeterminate"
  ) => {
    const currentTags = new Set(editingData[tagType] ?? []);
    if (isChecked === true) {
      currentTags.add(tag);
    } else {
      currentTags.delete(tag);
    }

    onDataChange({ ...editingData, [tagType]: Array.from(currentTags) });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded border">
      {/* 名称 */}
      <div>
        <Label
          htmlFor={`edit-title-${editingData.id}`}
          className="text-sm font-medium"
        >
          名称:
        </Label>
        <Input
          id={`edit-title-${editingData.id}`}
          type="text"
          value={editingData.title}
          onChange={(e) =>
            onDataChange({ ...editingData, title: e.target.value })
          }
          className="mt-1"
          disabled={isSaving}
        />
      </div>

      {/* 説明 */}
      <div>
        <Label
          htmlFor={`edit-desc-${editingData.id}`}
          className="text-sm font-medium"
        >
          説明:
        </Label>
        <Textarea
          id={`edit-desc-${editingData.id}`}
          value={descriptionValue}
          onChange={(e) =>
            onDataChange({
              ...editingData,
              description: e.target.value || null,
            })
          }
          rows={4}
          className="mt-1"
          disabled={isSaving}
        />
      </div>

      {/* 要約 */}
      <div>
        <Label
          htmlFor={`edit-summary-${editingData.id}`}
          className="text-sm font-medium"
        >
          要約 (80字程度):
        </Label>
        <Textarea
          id={`edit-summary-${editingData.id}`}
          value={summaryValue}
          onChange={(e) =>
            onDataChange({ ...editingData, summary: e.target.value || null })
          }
          rows={2}
          className="mt-1"
          disabled={isSaving}
        />
      </div>

      {/* 3点要約 */}
      <div>
        <Label
          htmlFor={`edit-simple_summary-${editingData.id}`}
          className="text-sm font-medium"
        >
          3点要約 (改行区切り):
        </Label>
        <Textarea
          id={`edit-simple_summary-${editingData.id}`}
          value={simpleSummaryValue}
          onChange={(e) => {
            const lines = e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter((s) => s !== "");
            onDataChange({
              ...editingData,
              simple_summary: lines.length > 0 ? lines : null,
            });
          }}
          rows={3}
          className="mt-1"
          disabled={isSaving}
          placeholder="例:\nポイント1\nポイント2\nポイント3"
        />
      </div>

      {/* 登録基準 */}
      <div>
        <Label
          htmlFor={`edit-criteria-${editingData.id}`}
          className="text-sm font-medium"
        >
          登録基準 (数字をカンマ区切り):
        </Label>
        <Input
          id={`edit-criteria-${editingData.id}`}
          type="text"
          value={criteriaValue}
          onChange={(e) => {
            const nums = e.target.value
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n) && n > 0);
            onDataChange({
              ...editingData,
              criteria: nums.length > 0 ? nums : null,
            });
          }}
          className="mt-1"
          disabled={isSaving}
          placeholder="例: 1, 4, 6"
        />
      </div>

      {/* 国名 */}
      <div>
        <Label
          htmlFor={`edit-country-${editingData.id}`}
          className="text-sm font-medium"
        >
          国名 (カンマ区切り):
        </Label>
        <Input
          id={`edit-country-${editingData.id}`}
          type="text"
          value={countryValue}
          onChange={(e) => {
            const countries = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "");
            onDataChange({
              ...editingData,
              country: countries.length > 0 ? countries : null,
            });
          }}
          className="mt-1"
          disabled={isSaving}
          placeholder="例: 日本, イタリア"
        />
      </div>

      {/* リージョン/地域  */}
      <div>
        <Label className="text-sm font-medium mb-1 block">地域:</Label>
        <div className="flex flex-wrap gap-x-3 gap-y-1 p-2 border rounded bg-white">
          {availableRegionTags.map((tag) => (
            <div key={`region-${tag}`} className="flex items-center space-x-1">
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
      </div>

      {/* 特徴 タグ */}
      <div>
        <Label className="text-sm font-medium mb-1 block">特徴:</Label>
        <div className="flex flex-wrap gap-x-3 gap-y-1 p-2 border rounded bg-white">
          {availableFeatureTags.map((tag) => (
            <div key={`feature-${tag}`} className="flex items-center space-x-1">
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
      </div>

      {/* ボタン */}
      <div className="mt-4 flex justify-end space-x-2">
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
