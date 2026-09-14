"use client";

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-4 w-full max-w-xl rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      <span className="font-semibold">Error: </span>
      {message}
    </div>
  );
}
