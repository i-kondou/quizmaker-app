import React, { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import HeritageAccordionItem, {HeritageData, HeritageResponse,} from "./AnalyseResult";
import "./App.css";

interface ImageData {
  id: number;
  filename: string;
  timestamp: string;
}

interface HeritageData {
  title: string;
  description: string;
  criteria: number[];
}

interface HeritageResponse {
  content: HeritageData[];
}

const BACKEND_URL = "http://localhost:8000";

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<HeritageResponse | null>(
    null
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<HeritageData | null>(null);

  // 画像一覧取得
  const fetchImages = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/image/all`);
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      } else {
        console.error("画像取得に失敗しました");
      }
    } catch (error) {
      console.error("画像取得エラー:", error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // ファイル選択
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 画像アップロード
  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(`${BACKEND_URL}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        console.log("アップロード成功");
        fetchImages();
      } else {
        console.error("アップロードに失敗しました");
      }
    } catch (error) {
      console.error("アップロードエラー:", error);
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  // 画像削除（カード上の削除ボタン用：モーダル表示時の削除は別ハンドラー）
  const handleDeleteModal = async () => {
    if (selectedIndex === null) return;
    const currentImage = images[selectedIndex];
    try {
      const response = await fetch(
        `${BACKEND_URL}/image/delete/${currentImage.id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        console.log("削除成功");
        setAnalysisResult(null);
        setSelectedIndex(null);
        fetchImages();
      } else {
        console.error("削除に失敗しました");
      }
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  const handleAnalyzeModal = async () => {
    if (selectedIndex === null) return;
    const currentImage = images[selectedIndex];
    try {
      const response = await fetch(
        `${BACKEND_URL}/heritage/preview/${currentImage.id}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        const data: HeritageResponse = await response.json();
        console.log("解析成功", data);
        setAnalysisResult(data);
      } else {
        console.error("解析に失敗しました");
      }
    } catch (error) {
      console.error("解析エラー:", error);
    }
  };

  const handleBackToImage = () => {
    setAnalysisResult(null);
  };

  // 前の画像へ移動
  const prevImage = () => {
    if (selectedIndex === null) return;
    setAnalysisResult(null);
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : 0);
  };

  // 次の画像へ移動
  const nextImage = () => {
    if (selectedIndex === null) return;
    setAnalysisResult(null);
    setSelectedIndex(
      selectedIndex < images.length - 1 ? selectedIndex + 1 : selectedIndex
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">画像管理</h1>

      {/* アップロードセクション */}
      <section className="mb-8">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border p-2 rounded"
          />
          <Button onClick={handleUpload} disabled={loading || !selectedFile}>
            {loading ? "アップロード中..." : "アップロード"}
          </Button>
        </div>
      </section>

      {/* 画像一覧表示 */}
      <section>
        <div className="flex flex-wrap gap-4">
          {images.map((img, index) => (
            <Card
              key={img.id}
              className="w-40 shadow cursor-pointer"
              onClick={() => setSelectedIndex(index)}
            >
              <CardContent className="flex flex-col items-center">
                <img
                  src={`${BACKEND_URL}/${img.filename}`}
                  alt=""
                  className="w-32 h-32 object-cover mb-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* モーダル */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative bg-white p-4 rounded shadow-lg max-w-3xl w-full">
            {/* 閉じるボタン：右上に配置、サイズ大 */}
            <button
              className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-gray-500 text-3xl font-bold text-white hover:bg-gray-600"
              onClick={() => {
                setSelectedIndex(null);
                setAnalysisResult(null);
              }}
            >
              ×
            </button>
            {/* 画像/解析結果表示エリア */}
            <div className="relative flex justify-center items-center">
              {/* 左矢印 */}
              <button
                onClick={prevImage}
                className="absolute -left-16 top-1/2 transform -translate-y-1/2 text-8xl text-gray-700 hover:text-gray-950"
              >
                ‹
              </button>
              {analysisResult ? (
                // 解析結果表示モード
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-2">解析結果</h2>
                  {analysisResult.content.map((item, idx) => (
                    <div key={idx} className="mb-4 border p-2 rounded">
                      {editingIndex === idx && editingData ? (
                        <div>
                          <div>
                            <label className="block text-sm font-medium">
                              名称:
                            </label>
                            <input
                              type="text"
                              value={editingData.title}
                              onChange={(e) =>
                                setEditingData({
                                  ...editingData,
                                  title: e.target.value,
                                })
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md p-1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">
                              説明:
                            </label>
                            <textarea
                              value={editingData.description}
                              onChange={(e) =>
                                setEditingData({
                                  ...editingData,
                                  description: e.target.value,
                                })
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md p-1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">
                              登録基準:
                            </label>
                            <input
                              type="text"
                              value={editingData.criteria.join(", ")}
                              onChange={(e) => {
                                const nums = e.target.value
                                  .split(",")
                                  .map((s) => Number(s.trim()))
                                  .filter((n) => !isNaN(n));
                                setEditingData({
                                  ...editingData,
                                  criteria: nums,
                                });
                              }}
                              className="mt-1 block w-full border border-gray-300 rounded-md p-1"
                            />
                          </div>
                          <div className="mt-2 flex justify-end space-x-2">
                            <Button
                              onClick={() => {
                                // 編集内容を確定して更新
                                if (analysisResult) {
                                  const newContent = [
                                    ...analysisResult.content,
                                  ];
                                  newContent[idx] = editingData;
                                  setAnalysisResult({ content: newContent });
                                }
                                setEditingIndex(null);
                                setEditingData(null);
                              }}
                            >
                              編集完了
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingIndex(null);
                                setEditingData(null);
                              }}
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p>
                            <strong>名称:</strong> {item.title}
                          </p>
                          <p>
                            <strong>説明:</strong> {item.description}
                          </p>
                          <p>
                            <strong>登録基準:</strong>{" "}
                            {item.criteria.join(", ")}
                          </p>
                          <Button
                            onClick={() => {
                              setEditingIndex(idx);
                              setEditingData(item);
                            }}
                          >
                            編集
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* 戻るボタン */}
                  <Button onClick={handleBackToImage}>戻る</Button>
                </div>
              ) : (
                // 画像表示モード
                <img
                  src={`${BACKEND_URL}/${images[selectedIndex].filename}`}
                  alt=""
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
              {/* 右矢印 */}
              <button
                onClick={nextImage}
                className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-8xl text-gray-700 hover:text-gray-950"
              >
                ›
              </button>
            </div>
            {/* ボタン群 */}
            <div className="mt-4 flex justify-center space-x-4">
              <Button
                variant="destructive"
                className="bg-red-500 text-white hover:bg-red-400"
                onClick={handleDeleteModal}
              >
                削除
              </Button>
              <Button
                className="bg-blue-500 text-white hover:bg-blue-400"
                onClick={handleAnalyzeModal}
              >
                解析
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
