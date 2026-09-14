// lib/starmaker/types.ts
export interface RecordingMeta {
  id: string;
  title: string;
  artist: string;
  duration: string; // formatted like mm:ss
  thumbnail: string; // URL to image
  pageUrl: string; // final public page URL
  audioUrl?: string; // direct audio file URL if publicly accessible
  videoUrl?: string; // direct video file URL if publicly accessible
}

export interface ResolveResult {
  success: boolean;
  recording?: RecordingMeta;
  error?: string;
}
