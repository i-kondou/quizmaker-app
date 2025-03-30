// src/components/ImageUpload.tsx
import React, { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  selectedFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isLoading: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  selectedFile,
  onFileChange,
  onUpload,
  isLoading,
}) => {
  return (
    <section className="mb-8">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="border p-2 rounded"
          disabled={isLoading}
        />
        <Button onClick={onUpload} disabled={isLoading || !selectedFile}>
          {isLoading ? "アップロード中..." : "アップロード"}
        </Button>
      </div>
    </section>
  );
};

export default ImageUpload;
