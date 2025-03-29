import React, { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import "./App.css";

interface ImageData {
  filename: string;
  // 必要に応じて created_at などのプロパティを追加
}

interface HeritageItem {
  title: string;
  description: string;
  criteria: number[];
}

interface HeritageResponse {
  content: HeritageItem[];
}

// バックエンドのURL（必要に応じて環境変数などで管理）
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [heritageData, setHeritageData] = useState<{
    [key: string]: HeritageItem[];
  }>({});
  const [loading, setLoading] = useState(false);

  // バックエンドからアップロード済み画像一覧を取得する関数
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

  // ファイル選択時のハンドラー
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 画像アップロード処理
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
        const data = await response.json();
        console.log("アップロード成功:", data);
        // アップロード後に画像一覧を更新する
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

  // 選択した画像のOCR/世界遺産情報をプレビューする処理
  const handleHeritagePreview = async (filename: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/heritage/preview/${filename}`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        const data: HeritageResponse = await response.json();
        setHeritageData((prev) => ({
          ...prev,
          [filename]: data.content,
        }));
      } else {
        console.error("OCRプレビューに失敗しました");
      }
    } catch (error) {
      console.error("OCRプレビューエラー:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">
        画像アップロードと世界遺産情報抽出
      </h1>

      {/* 画像アップロードセクション */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">画像アップロード</h2>
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

      {/* 画像一覧セクション */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">アップロード済み画像</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <Card key={img.filename}>
              <CardHeader>
                <CardTitle>{img.filename}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 画像のsrcにバックエンドURLを追加して、完全なURLで表示 */}
                <img
                  src={`${BACKEND_URL}/${img.filename}`}
                  alt={img.filename}
                  className="w-16 h-12 object-cover mb-2"
                />
                {/* OCRプレビュー用のダイアログ */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleHeritagePreview(img.filename)}>
                      OCRプレビュー
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <h3 className="text-xl font-bold mb-2">世界遺産情報</h3>
                    {heritageData[img.filename] ? (
                      heritageData[img.filename].map((item, index) => (
                        <div key={index} className="mb-4">
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
                        </div>
                      ))
                    ) : (
                      <p>情報が取得されていません。</p>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default App;
