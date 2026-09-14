"use client";

import Image from "next/image";
import type { RecordingMeta } from "@/lib/starmaker/types";

export default function RecordingCard({ recording }: { recording: RecordingMeta }) {
  const { title, artist, duration, thumbnail, audioUrl, videoUrl } = recording;

  const formatFilename = (ext: string) => {
    const safeTitle = (title || "recording").replace(/[^a-zA-Z0-9\-_. ]/g, "");
    const safeArtist = (artist || "unknown").replace(/[^a-zA-Z0-9\-_. ]/g, "");
    return `${safeTitle.trim()} - ${safeArtist.trim()}.${ext}`;
  };

  const hasDownloads = audioUrl || videoUrl;

  return (
    <div className="mt-8 w-full max-w-xl rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex gap-4 p-5">
        {thumbnail ? (
          <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
            <Image
              src={thumbnail}
              alt={`${title} thumbnail`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-400 text-3xl">
            🎵
          </div>
        )}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title || "Unknown Title"}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{artist || "Unknown Artist"}</p>
            {duration && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{duration}</p>
            )}
          </div>

          {hasDownloads ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {audioUrl && (
                // <a
                //   href={`/api/download?url=${encodeURIComponent(audioUrl)}&format=mp3&filename=${encodeURIComponent(formatFilename("mp3"))}`}
                //   className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                //   download
                // >
                //   ⬇ Download Audio
                // </a>
                <a
  href={`/api/download?url=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(formatFilename("audio"))}`}
  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
  download
>
  ⬇ Download Audio
</a>
              )}
              {/* {videoUrl && (
                <a
                  href={`/api/download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(formatFilename("mp4"))}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
                  download
                >
                  ⬇ Download Video
                </a>
              )} */}
            </div>
          ) : (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              The recording is publicly viewable, but StarMaker isn&apos;t exposing a downloadable media file through its public web experience.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-2">
        <a
          href={recording.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline"
        >
          View on StarMaker →
        </a>
      </div>
    </div>
  );
}
