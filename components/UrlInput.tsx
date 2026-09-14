"use client";

import { useState, FormEvent } from "react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export default function UrlInput({ onSubmit, disabled }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      new URL(url);
      setValidationError(null);
      onSubmit(url.trim());
    } catch {
      setValidationError("Please enter a valid URL.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-xl gap-2" aria-label="StarMaker URL form">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste StarMaker link here..."
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          disabled={disabled}
        >
          Get Recording
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {/* Example: https://starmaker.onelink.me/v4ei/y817d5yr */}
      </p>
      {validationError && (
        <p className="text-sm text-red-600" role="alert">
          {validationError}
        </p>
      )}
    </form>
  );
}
