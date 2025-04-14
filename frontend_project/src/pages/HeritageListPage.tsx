import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { HeritageData } from "../types";
import { fetchAllHeritagesAPI } from "../services/api";
import { toRomanNumeral } from "../utils/helpers";
import { UNESCO_TAGS, REGION_TAGS, FEATURE_TAGS } from "../../constants";

interface HeritageWithId extends HeritageData {
  id: number; // APIからIDが返されることを想定
}

const availableCriteria = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const getUnescoTagTextColorClass = (tag: string | null | undefined): string => {
  switch (tag) {
    case "文化遺産":
      return "text-orange-700";
    case "自然遺産":
      return "text-green-700";
    case "複合遺産":
      return "text-gray-700";
    default:
      return "text-gray-700"; // デフォルト色
  }
};

const HeritageListPage: React.FC = () => {
  const [allHeritages, setAllHeritages] = useState<HeritageWithId[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCriteria, setSelectedCriteria] = useState<number[]>([]);
  const [selectedUnescoTag, setSelectedUnescoTag] = useState<string>("");
  const [selectedRegionTags, setSelectedRegionTags] = useState<string[]>([]);
  const [selectedFeatureTags, setSelectedFeatureTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // --- データ取得 ---
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

  // --- フィルタリング・ソート ---
  const filteredAndSortedHeritages = useMemo(() => {
    let filtered = [...allHeritages];
    // 名前検索フィルタ
    if (searchTerm) {
      filtered = filtered.filter((h) =>
        h.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // 登録基準フィルタ
    if (selectedCriteria.length > 0) {
      filtered = filtered.filter(
        (h) =>
          h.criteria && selectedCriteria.every((sc) => h.criteria!.includes(sc))
      );
    }
    // UNESCO分類フィルタ
    if (selectedUnescoTag && selectedUnescoTag !== "") {
      filtered = filtered.filter((h) => h.unesco_tag === selectedUnescoTag);
    }
    // 地域フィルタ
    if (selectedRegionTags.length > 0) {
      filtered = filtered.filter((h) => {
        const itemRegions = new Set(h.region ?? []);
        return selectedRegionTags.every((tag) => itemRegions.has(tag));
      });
    }
    // 特徴フィルタ
    if (selectedFeatureTags.length > 0) {
      filtered = filtered.filter((h) => {
        const itemFeatures = new Set(h.feature ?? []);
        return selectedFeatureTags.every((tag) => itemFeatures.has(tag));
      });
    }

    // ソート
    filtered.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, "ja");
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [
    allHeritages,
    searchTerm,
    selectedCriteria,
    selectedUnescoTag,
    selectedRegionTags,
    selectedFeatureTags,
    sortOrder,
  ]);

  // --- 登録基準フィルタ用ハンドラ ---
  const handleCriteriaChange = (criterion: number) => {
    setSelectedCriteria((prev) =>
      prev.includes(criterion)
        ? prev.filter((c) => c !== criterion)
        : [...prev, criterion]
    );
  };
  // --- UNESCO分類フィルタ用ハンドラ ---
  const handleUnescoTagChange = (value: string) => {
    setSelectedUnescoTag(value === "all" ? "" : value);
  };
  // --- 地域フィルタ用ハンドラ ---
  const handleRegionTagChange = (tag: string) => {
    setSelectedRegionTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };
  // --- 特徴フィルタ用ハンドラ ---
  const handleFeatureTagChange = (tag: string) => {
    setSelectedFeatureTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // --- フィルタのリセット --- ///
  const resetFilters = () => {
    setSelectedCriteria([]);
    setSelectedUnescoTag("");
    setSelectedRegionTags([]);
    setSelectedFeatureTags([]);
  };

  // --- フィルターの有無を判定 ---
  const hasActiveFilters =
    selectedCriteria.length > 0 ||
    selectedUnescoTag !== "" ||
    selectedRegionTags.length > 0 ||
    selectedFeatureTags.length > 0;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">
        世界遺産一覧
      </h1>

      {/* --- 操作エリア --- */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50/80 flex flex-wrap gap-4 items-end shadow-sm">
        {/* 検索 */}
        <div className="flex-grow min-w-[200px]">
          <Label htmlFor="search-heritage">名前で検索</Label>
          <Input
            id="search-heritage"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>
        {/* ソート */}
        <div className="min-w-[120px]">
          {" "}
          <Label>並び替え</Label>
          <Button
            variant="outline"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="mt-1 w-full"
          >
            名前 ({sortOrder === "asc" ? "昇順 ↑" : "降順 ↓"})
          </Button>
        </div>
        {/* --- タグ絞り込み --- */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-1">
              タグで絞り込み...
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col bg-white">
            {" "}
            <DialogHeader>
              <DialogTitle>タグで絞り込み</DialogTitle>
              <DialogDescription>
                表示する世界遺産をタグで絞り込みます。
              </DialogDescription>
            </DialogHeader>
            {/* --- フィルターコンテンツ (スクロール可能にする) --- */}
            <div className="flex-grow overflow-y-auto space-y-4 p-1">
              {/* 基準フィルタ */}
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  登録基準
                </Label>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {availableCriteria.map((crit) => (
                    <div key={crit} className="flex items-center space-x-1">
                      <Checkbox
                        id={`modal-criteria-${crit}`}
                        checked={selectedCriteria.includes(crit)}
                        onCheckedChange={() => handleCriteriaChange(crit)}
                      />
                      <Label
                        htmlFor={`modal-criteria-${crit}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {toRomanNumeral(crit)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {/* UNESCO分類フィルタ */}
              <div className="min-w-[250px]">
                {" "}
                {/* ラジオボタン用に幅調整 */}
                <Label className="text-sm font-medium mb-1 block">
                  UNESCO分類
                </Label>
                {/* RadioGroup を使用 */}
                <RadioGroup
                  value={selectedUnescoTag || "all"} // value が "" の場合は "all" を選択状態にする
                  onValueChange={handleUnescoTagChange} // 値変更時にハンドラを呼び出す
                  className="flex flex-wrap gap-x-4 gap-y-1 mt-1" // 横並びにするためのクラス
                >
                  {/* 「すべて」の選択肢 */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="unesco-all" />
                    <Label
                      htmlFor="unesco-all"
                      className="text-sm font-normal cursor-pointer"
                    >
                      すべて
                    </Label>
                  </div>
                  {/* UNESCO_TAGS から選択肢を生成 */}
                  {UNESCO_TAGS.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <RadioGroupItem value={tag} id={`unesco-${tag}`} />
                      <Label
                        htmlFor={`unesco-${tag}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              {/* 地域タグフィルタ */}
              <div>
                <Label className="text-sm font-medium mb-1 block">地域</Label>
                <div className="flex flex-wrap gap-x-3 gap-y-1 max-h-24 overflow-y-auto p-2 border rounded">
                  {REGION_TAGS.map((tag) => (
                    <div
                      key={`modal-region-${tag}`}
                      className="flex items-center space-x-1"
                    >
                      <Checkbox
                        id={`modal-region-${tag}`}
                        checked={selectedRegionTags.includes(tag)}
                        onCheckedChange={() => handleRegionTagChange(tag)}
                      />
                      <Label
                        htmlFor={`modal-region-${tag}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {/* 特徴タグフィルタ */}
              <div>
                <Label className="text-sm font-medium mb-1 block">特徴</Label>
                <div className="flex flex-wrap gap-x-3 gap-y-1 max-h-32 overflow-y-auto p-2 border rounded">
                  {FEATURE_TAGS.map((tag) => (
                    <div
                      key={`modal-feature-${tag}`}
                      className="flex items-center space-x-1"
                    >
                      <Checkbox
                        id={`modal-feature-${tag}`}
                        checked={selectedFeatureTags.includes(tag)}
                        onCheckedChange={() => handleFeatureTagChange(tag)}
                      />
                      <Label
                        htmlFor={`modal-feature-${tag}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* --- フッターボタン --- */}
            <DialogFooter className="mt-4 flex-shrink-0">
              <Button variant="ghost" onClick={resetFilters}>
                リセット
              </Button>
              <DialogClose asChild>
                <Button type="button">適用して閉じる</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {hasActiveFilters && ( // アクティブなフィルターがある場合のみ表示
        <div className="mb-4 p-3 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-800">
              現在の絞り込み:
            </span>
            {/* 選択中のUNESCOタグ */}
            {selectedUnescoTag && (
              <Badge
                variant="secondary"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                {selectedUnescoTag}
                <button
                  onClick={() => handleUnescoTagChange("all")}
                  className="ml-1 p-0.5 rounded-full hover:bg-gray-400/50"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">{selectedUnescoTag} を解除</span>
                </button>
              </Badge>
            )}
            {/* 選択中の登録基準 */}
            {selectedCriteria.map((crit) => (
              <Badge
                key={`crit-${crit}`}
                variant="secondary"
                className="bg-purple-100 hover:bg-purple-200 text-purple-800"
              >
                基準 {toRomanNumeral(crit)}
                <button
                  onClick={() => handleCriteriaChange(crit)}
                  className="ml-1 p-0.5 rounded-full hover:bg-purple-400/50"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">基準 {crit} を解除</span>
                </button>
              </Badge>
            ))}
            {/* 選択中の地域タグ */}
            {selectedRegionTags.map((tag) => (
              <Badge
                key={`region-${tag}`}
                variant="secondary"
                className="bg-blue-100 hover:bg-blue-200 text-blue-800"
              >
                {tag}
                <button
                  onClick={() => handleRegionTagChange(tag)}
                  className="ml-1 p-0.5 rounded-full hover:bg-blue-400/50"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">地域 {tag} を解除</span>
                </button>
              </Badge>
            ))}
            {/* 選択中の特徴タグ */}
            {selectedFeatureTags.map((tag) => (
              <Badge
                key={`feature-${tag}`}
                variant="secondary"
                className="bg-green-100 hover:bg-green-200 text-green-800"
              >
                {tag}
                <button
                  onClick={() => handleFeatureTagChange(tag)}
                  className="ml-1 p-0.5 rounded-full hover:bg-green-400/50"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">特徴 {tag} を解除</span>
                </button>
              </Badge>
            ))}
            {/* すべて解除ボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="ml-auto text-blue-700 hover:bg-blue-100 h-auto px-2 py-1"
            >
              すべて解除
            </Button>
          </div>
        </div>
      )}

      {/* --- 一覧表示エリア --- */}
      {error && <div className="text-center py-4 text-red-600">{error}</div>}

      {isLoading ? (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 animate-spin inline-block text-gray-500" />
        </div>
      ) : !error && filteredAndSortedHeritages.length > 0 ? (
        <ul className="space-y-3">
          {" "}
          {filteredAndSortedHeritages.map((heritage) => (
            <li
              key={heritage.id}
              className={`border rounded-md transition-colors duration-150 hover:bg-gray-100`}
            >
              <Link
                to={`/heritages/${heritage.id}`}
                className="flex justify-between items-center p-4 group"
              >
                {" "}
                {/* 左側: タイトル */}
                <span className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 group-hover:underline">
                  {heritage.title}
                </span>
                {/* 右側: 国、基準、UNESCOタグ */}
                <div className="text-right ml-4 flex-shrink-0 space-y-1">
                  {" "}
                  {/* 国名 */}
                  {heritage.country && heritage.country.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {heritage.country.join(", ")}
                    </div>
                  )}
                  {/* 基準とUNESCOタグ */}
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    基準:{" "}
                    {heritage.criteria?.map(toRomanNumeral).join(", ") || "N/A"}
                    {heritage.unesco_tag && (
                      <span
                        className={`ml-2 font-semibold ${getUnescoTagTextColorClass(
                          heritage.unesco_tag
                        )}`}
                      >
                        {" "}
                        [{heritage.unesco_tag}]
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        // --- 結果なし表示 ---
        <p className="text-center text-gray-500 py-10">
          該当する世界遺産が見つかりません。
        </p>
      )}
    </div>
  );
};

export default HeritageListPage;
