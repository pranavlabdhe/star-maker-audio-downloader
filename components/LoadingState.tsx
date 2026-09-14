"use client";

export default function LoadingState() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <svg
        className="h-8 w-8 animate-spin text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
        />
      </svg>
      <div className="flex flex-col items-start gap-1 text-sm text-gray-600 dark:text-gray-400">
        <span>✓ Checking link</span>
        <span>✓ Finding recording</span>
        <span className="text-blue-500 animate-pulse">● Checking available media…</span>
      </div>
    </div>
  );
}
