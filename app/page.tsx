"use client";

import UrlInput from "@/components/UrlInput";
import RecordingCard from "@/components/RecordingCard";
import LoadingState from "@/components/LoadingState";
import ErrorMessage from "@/components/ErrorMessage";
import { useState } from "react";
import type { RecordingMeta } from "@/lib/starmaker/types";

export default function Home() {
  const [recording, setRecording] = useState<RecordingMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResolve = async (url: string) => {
    setLoading(true);
    setError(null);
    setRecording(null);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        setRecording(data.recording);
      } else {
        setError(data.error || "Unable to resolve recording.");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        StarMaker Recording Downloader
      </h1>
      <p className="text-lg mb-6 text-gray-700 dark:text-gray-300 max-w-xl text-center">
        Paste a public StarMaker recording link and download the available recording.
      </p>
      <UrlInput onSubmit={handleResolve} disabled={loading} />
      {loading && <LoadingState />}
      {error && <ErrorMessage message={error} />}
      {recording && <RecordingCard recording={recording} />}
      <footer className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        This is an independent tool and is not affiliated with StarMaker. Only download recordings you own or have permission to download.
      </footer>
    </main>
  );
}
