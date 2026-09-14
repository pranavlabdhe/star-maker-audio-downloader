// lib/utils/filename.ts
/**
 * Sanitize a filename for macOS/Windows usage.
 * Removes characters that are illegal in filenames and trims whitespace.
 */
export function sanitizeFilename(name: string): string {
  // Remove control characters and reserved symbols
  const sanitized = name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Truncate to a reasonable length (255 chars max for most filesystems)
  return sanitized.slice(0, 250);
}
