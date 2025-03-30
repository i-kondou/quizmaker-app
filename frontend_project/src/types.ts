// src/types.ts
export interface ImageData {
  id: number;
  filename: string;
  timestamp: string;
}

export interface HeritageData {
  title: string;
  description: string;
  criteria: number[];
}

export interface HeritageResponse {
  content: HeritageData[];
}
