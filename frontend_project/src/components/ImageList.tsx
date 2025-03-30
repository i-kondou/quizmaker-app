// src/components/ImageList.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "../types"; // 型定義をインポート

const BACKEND_URL = "http://localhost:8000"; // Appから渡すか、Configファイル等で管理

interface ImageListProps {
  images: ImageData[];
  onImageClick: (index: number) => void;
  disabled: boolean; // ローディング中など
}

const ImageList: React.FC<ImageListProps> = ({
  images,
  onImageClick,
  disabled,
}) => {
  return (
    <section>
      <div className="flex flex-wrap gap-4">
        {images.map((img, index) => (
          <Card
            key={img.id}
            className={`w-40 shadow cursor-pointer ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => !disabled && onImageClick(index)}
          >
            <CardContent className="flex flex-col items-center p-2">
              <img
                src={`${BACKEND_URL}/${img.filename}`} // BACKEND_URLの扱いに注意
                alt={`Uploaded ${img.id}`}
                className="w-32 h-32 object-cover mb-1"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ImageList;
