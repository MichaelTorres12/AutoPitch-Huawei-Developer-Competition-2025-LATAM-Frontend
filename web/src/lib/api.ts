import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export type UploadResponse = {
  id: string;
  key: string;
  size: number;
  contentType: string;
  getUrl: string;
};

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axios.post<UploadResponse>(`${API_BASE_URL}/api/uploads`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export type ProcessRequest = {
  uploadId: string;
  language: string;
  objective: string;
  tone: string;
  slidesNumber: string | number;
};

export type ProcessResponse = {
  ok: boolean;
  pitch_deck: {
    summary: string;
    highlights: { label: string; summary: string }[];
    slides: { title: string; bullets: string[] }[];
    script: { slide: number; what_to_say: string }[];
  };
  input_video_url?: string;
  audio_url?: string;
  frame_urls?: string[];
  srt_url?: string;
};

export async function processFromUpload(payload: ProcessRequest): Promise<ProcessResponse> {
  const { data } = await axios.post<ProcessResponse>(`${API_BASE_URL}/cloud/process-from-upload`, payload);
  return data;
}


