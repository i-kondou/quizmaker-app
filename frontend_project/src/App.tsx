import React, { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import "./App.css";

interface ImageData {
  id: number;
  filename: string;
  timestamp: string;
}

const BACKEND_URL = "http://localhost:8000";

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  // モーダルで表示中の画像のインデックス（null の場合はモーダル非表示）
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/image/delete/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log("削除成功");
        fetchImages();
        // モーダルで表示中の場合、閉じる
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        }
      } else {
        console.error("削除に失敗しました");
      }
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  // モーダル内で削除処理
  const handleDeleteModal = async () => {
    if (selectedIndex === null) return;
    const currentImage = images[selectedIndex];
    await handleDelete(currentImage.id);
  };

  // 解析ボタン（プレースホルダー）
  const handleAnalyzeModal = () => {
    if (selectedIndex === null) return;
    const currentImage = images[selectedIndex];
    alert(`解析処理中: ${currentImage.filename}`);
  };

  // 前の画像へ移動
  const prevImage = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : 0);
  };

  // 次の画像へ移動
  const nextImage = () => {
    if (selectedIndex === null) return;
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

      {/* モーダル（大きな画像表示、削除・解析・ナビゲーション） */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative bg-white p-4 rounded shadow-lg max-w-3xl w-full">
            {/* 閉じるボタン：右上に配置、サイズ大 */}
            <button
              className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-gray-500 text-3xl font-bold text-white hover:bg-gray-600"
              onClick={() => setSelectedIndex(null)}
            >
              ×
            </button>
            {/* 画像表示エリア（左右の矢印を画像外に配置） */}
            <div className="relative flex justify-center items-center">
              {/* 左矢印：画像左外側に配置 */}
              <button
                onClick={prevImage}
                className="absolute -left-16 top-1/2 transform -translate-y-1/2 text-8xl text-gray-700 hover:text-gray-950"
              >
                ‹
              </button>
              <img
                src={`${BACKEND_URL}/${images[selectedIndex].filename}`}
                alt=""
                className="max-w-full max-h-[80vh] object-contain"
              />
              {/* 右矢印：画像右外側に配置 */}
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
              <Button onClick={handleAnalyzeModal}>解析</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
