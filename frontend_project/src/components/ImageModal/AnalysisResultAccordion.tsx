// src/components/ImageModal/AnalysisResultAccordion.tsx
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import AnalysisEditForm from "./AnalysisEditForm";
import { HeritageData, HeritageResponse } from "../../types";
import { toRomanNumeral } from "@/utils/helpers";

interface AnalysisResultAccordionProps {
  analysisResult: HeritageResponse; // null ではない前提
  accordionDefaultValue: string[];
  editingIndex: number | null;
  editingData: HeritageData | null;
  onEditStart: (index: number, data: HeritageData) => void;
  onEditChange: (data: HeritageData) => void; // 編集中のデータ変更
  onEditComplete: () => void;
  onEditCancel: () => void;
  isSaving: boolean;
}

const AnalysisResultAccordion: React.FC<AnalysisResultAccordionProps> = ({
  analysisResult,
  accordionDefaultValue,
  editingIndex,
  editingData,
  onEditStart,
  onEditChange,
  onEditComplete,
  onEditCancel,
  isSaving,
}) => {
  return (
    <div className="w-full">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">
        解析結果
      </h2>
      <Accordion
        type="multiple"
        defaultValue={accordionDefaultValue}
        className="w-full"
      >
        {analysisResult.content.map((item, idx) => (
          <AccordionItem key={item.id} value={`item-${item.id}`}>
            <AccordionTrigger className="text-base md:text-lg font-semibold hover:no-underline text-left px-1">
              {item.title}
              {/* {item.criteria && item.criteria.length > 0 && (
                <span className="text-base text-gray-500 font-normal ml-auto whitespace-nowrap">
                  登録基準： {item.criteria.map(toRomanNumeral).join(", ")}
                </span>
              )} */}
            </AccordionTrigger>
            <AccordionContent className="px-1">
              {editingIndex === idx && editingData ? (
                // --- 編集フォームコンポーネントを使用 ---
                <AnalysisEditForm
                  editingData={editingData}
                  onDataChange={onEditChange}
                  onComplete={onEditComplete}
                  onCancel={onEditCancel}
                  isSaving={isSaving}
                />
              ) : (
                // --- 通常表示 ---
                <div className="space-y-1 pl-2 text-sm md:text-base">
                  <p className="whitespace-pre-wrap break-words">
                    <strong>説明:</strong> {item.description}
                  </p>
                  <p>
                    <strong>登録基準:</strong>{" "}
                    {item.criteria?.map(toRomanNumeral).join(", ") || "N/A"}
                  </p>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditStart(idx, item)}
                      disabled={isSaving || editingIndex !== null}
                    >
                      編集
                    </Button>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AnalysisResultAccordion;
