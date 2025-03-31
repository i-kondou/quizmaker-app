import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { HeritageData } from "../types";
import { fetchAllHeritagesAPI } from "../services/api";

interface HeritageWithId extends HeritageData {
  id?: number;
}

const HeritageListPage: React.FC = () => {
  const [allHeritages, setAllHeritages] = useState<HeritageWithId[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCriteria, setSelectedCriteria] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // 'asc' or 'desc'

  // --- データ取得 ---
  const fetchAllHeritages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // --- 変更点: fetchAllHeritagesAPI を呼び出す ---
      const data = await fetchAllHeritagesAPI();
      setAllHeritages(data);
    } catch (err: any) {
      // APIサービスで投げられたエラーをキャッチ
      setError(err.message || "データの取得中にエラーが発生しました");
      setAllHeritages([]); // エラー時は空にする
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllHeritages();
  }, [fetchAllHeritages]);

  // --- クライアントサイドでのフィルタリング・ソート ---
  const filteredAndSortedHeritages = useMemo(() => {
    let filtered = [...allHeritages];

    // 検索フィルタ
    if (searchTerm) {
      filtered = filtered.filter((h) =>
        h.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 基準フィルタ (選択された基準をすべて含むものを抽出)
    if (selectedCriteria.length > 0) {
      filtered = filtered.filter((h) =>
        selectedCriteria.every((sc) => h.criteria?.includes(sc))
      );
    }

    // ソート (日本語対応)
    filtered.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, "ja");
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [allHeritages, searchTerm, selectedCriteria, sortOrder]);

  // --- 基準フィルタ用ハンドラ ---
  const handleCriteriaChange = (criterion: number) => {
    setSelectedCriteria(
      (prev) =>
        prev.includes(criterion)
          ? prev.filter((c) => c !== criterion) // 含まれていれば削除
          : [...prev, criterion] // 含まれていなければ追加
    );
  };

  // --- 利用可能な基準リスト (例) ---
  const availableCriteria = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 必要に応じて動的に取得

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">世界遺産一覧</h1>

      {/* --- 操作エリア --- */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50 flex flex-wrap gap-4 items-center">
        {/* 検索 */}
        <div className="flex-grow min-w-[200px]">
          <Label htmlFor="search-heritage" className="text-sm font-medium">
            名前で検索
          </Label>
          <Input
            id="search-heritage"
            type="text"
            placeholder="例: 姫路城"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 基準フィルタ */}
        <div className="min-w-[250px]">
          <Label className="text-sm font-medium mb-1 block">
            登録基準で絞り込み
          </Label>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {availableCriteria.map((crit) => (
              <div key={crit} className="flex items-center space-x-1">
                <Checkbox
                  id={`criteria-${crit}`}
                  checked={selectedCriteria.includes(crit)}
                  onCheckedChange={() => handleCriteriaChange(crit)}
                />
                <Label
                  htmlFor={`criteria-${crit}`}
                  className="text-sm cursor-pointer"
                >
                  ({crit})
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* ソート */}
        <div>
          <Label className="text-sm font-medium mb-1 block">並び替え</Label>
          <Button
            variant="outline"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            名前 ({sortOrder === "asc" ? "昇順 ↑" : "降順 ↓"})
          </Button>
        </div>
      </div>

      {/* --- 一覧表示エリア --- */}
      {isLoading && (
        <div className="text-center py-4">
          <Loader2 className="w-8 h-8 animate-spin inline-block text-gray-500" />
        </div>
      )}
      {error && <div className="text-center py-4 text-red-600">{error}</div>}
      {!isLoading &&
        !error &&
        (filteredAndSortedHeritages.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredAndSortedHeritages.map((heritage, index) => (
              <AccordionItem
                key={heritage.id ?? index}
                value={`item-${heritage.id ?? index}`}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-4">
                    <span className="text-lg font-semibold text-left">
                      {heritage.title}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      基準: {heritage.criteria?.join(", ") || "N/A"}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="whitespace-pre-wrap text-gray-800">
                    {heritage.description || "説明なし"}
                  </p>
                  {/* 必要なら他の情報も表示 */}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-gray-500 py-4">
            該当する世界遺産が見つかりません。
          </p>
        ))}
    </div>
  );
};

export default HeritageListPage;
