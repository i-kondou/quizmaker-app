import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
// Link を react-router-dom からインポート
import { Link } from "react-router-dom";
import { HeritageData } from "../types";
import { fetchAllHeritagesAPI } from "../services/api";
import { toRomanNumeral } from "../utils/helpers";

interface HeritageWithId extends HeritageData {
  id: number; // APIからIDが返されることを想定
}

const HeritageListPage: React.FC = () => {
  const [allHeritages, setAllHeritages] = useState<HeritageWithId[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCriteria, setSelectedCriteria] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // --- 編集・問題作成関連のStateは削除 ---
  // const [editingHeritageId, setEditingHeritageId] = useState<number | null>(null);
  // const [currentEditingData, setCurrentEditingData] = useState<HeritageWithId | null>(null);
  // const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  // const [generatingQuizId, setGeneratingQuizId] = useState<number | null>(null);

  // --- データ取得 (変更なし) ---
  const fetchAllHeritages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllHeritagesAPI();
      setAllHeritages(data.map((h, index) => ({ ...h, id: h.id ?? index }))); // IDを保証
    } catch (err: any) {
      /* ... */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllHeritages();
  }, [fetchAllHeritages]);

  // --- フィルタリング・ソート (変更なし) ---
  const filteredAndSortedHeritages = useMemo(() => {
    let filtered = [...allHeritages];
    // 検索フィルタ
    if (searchTerm) {
      filtered = filtered.filter((h) =>
        h.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // 基準フィルタ
    if (selectedCriteria.length > 0) {
      filtered = filtered.filter(
        (h) =>
          h.criteria && selectedCriteria.every((sc) => h.criteria!.includes(sc))
      );
    }
    // ソート
    filtered.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, "ja");
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [allHeritages, searchTerm, selectedCriteria, sortOrder]);

  // --- 基準フィルタ用ハンドラ (変更なし) ---
  const handleCriteriaChange = (criterion: number) => {
    setSelectedCriteria((prev) =>
      prev.includes(criterion)
        ? prev.filter((c) => c !== criterion)
        : [...prev, criterion]
    );
  };
  const availableCriteria = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // --- 編集・問題作成関連ハンドラは削除 ---
  // const handleEditClick = ...
  // const handleCancelEdit = ...
  // const handleEditDataChange = ...
  // const handleSaveEdit = ...
  // const handleGenerateQuizClick = ...

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">世界遺産一覧</h1>

      {/* --- 操作エリア (変更なし) --- */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50 flex flex-wrap gap-4 items-center">
        {/* ... (検索、フィルタ、ソート UI) ... */}
        <div className="flex-grow min-w-[200px]">
          {" "}
          <Label>名前で検索</Label>{" "}
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />{" "}
        </div>
        <div className="min-w-[250px]">
          {" "}
          <Label>登録基準で絞り込み</Label>{" "}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {availableCriteria.map((crit) => (
              <div key={crit}>
                <Checkbox
                  id={`c-${crit}`}
                  checked={selectedCriteria.includes(crit)}
                  onCheckedChange={() => handleCriteriaChange(crit)}
                />
                <Label htmlFor={`c-${crit}`}>{toRomanNumeral(crit)}</Label>
              </div>
            ))}
          </div>{" "}
        </div>
        <div>
          {" "}
          <Label>並び替え</Label>{" "}
          <Button
            variant="outline"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            名前 ({sortOrder === "asc" ? "昇" : "降"})
          </Button>{" "}
        </div>
      </div>

      {/* --- 一覧表示エリア (リスト形式 + リンク) --- */}
      {isLoading && (
        <div className="text-center py-4">
          {" "}
          <Loader2 className="w-8 h-8 animate-spin inline-block text-gray-500" />{" "}
        </div>
      )}
      {error && <div className="text-center py-4 text-red-600">{error}</div>}
      {!isLoading &&
        !error &&
        (filteredAndSortedHeritages.length > 0 ? (
          <ul className="space-y-2">
            {" "}
            {/* ulとliでリスト表示 */}
            {filteredAndSortedHeritages.map((heritage) => (
              <li
                key={heritage.id}
                className="p-4 border rounded-md hover:bg-gray-50"
              >
                {/* Linkコンポーネントで詳細ページへのリンクを作成 */}
                <Link
                  to={`/heritages/${heritage.id}`}
                  className="flex justify-between items-center group"
                >
                  {/* タイトル */}
                  <span className="text-lg font-semibold text-blue-700 group-hover:underline">
                    {heritage.title}
                  </span>
                  {/* 基準 */}
                  <span className="text-sm text-gray-600 ml-auto whitespace-nowrap pl-4">
                    基準:{" "}
                    {heritage.criteria?.map(toRomanNumeral).join(", ") || "N/A"}
                  </span>
                </Link>
                {/* 説明やボタンはここでは表示しない */}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">
            該当する世界遺産が見つかりません。
          </p>
        ))}
    </div>
  );
};

export default HeritageListPage;
