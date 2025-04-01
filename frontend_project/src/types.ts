// src/types.ts
export interface ImageData {
  id: number;
  filename: string;
  timestamp: string;
}

export interface HeritageData {
  id: number;
  title: string;
  description: string | null;
  summary: string | null;
  simple_summary: string[] | null;
  criteria: number[] | null;
  unesco_tag: string | null;
  country: string[] | null;
  region: string[] | null;
  feature: string[] | null;
}

export interface HeritageResponse {
  content: HeritageData[];
}

export interface HeritageWithId extends HeritageData {
  id: number;
}

export type ModalViewMode = "image" | "analysis";
