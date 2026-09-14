// lib/starmaker/parser.ts
import { load } from 'cheerio';
import type { RecordingMeta } from './types';

/**
 * Parse the HTML of a public StarMaker recording page and extract metadata.
 * The implementation uses generic Open Graph tags and falls back to common
 * selectors. It purposefully avoids any private APIs – only data that is
 * visible to a normal browser is scraped.
 */
export function parseRecordingPage(html: string, pageUrl: string): RecordingMeta | null {
  const $ = load(html);

  // Prefer Open Graph metadata when present
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    '';
  const description = $('meta[property="og:description"]').attr('content') || '';

  // Attempt to extract artist and duration from description if it follows a pattern
  let artist = '';
  let duration = '';
  const descMatch = description.match(/by\s+([^|]+)\s*\|\s*([0-9]{1,2}:[0-9]{2})/i);
  if (descMatch) {
    artist = descMatch[1].trim();
    duration = descMatch[2];
  }

  // Thumbnail image
  const thumbnail = $('meta[property="og:image"]').attr('content') || '';

  // Look for audio or video source tags that are directly accessible
  const audioUrl = $('audio source').attr('src') || $('audio').attr('src') || '';
  const videoUrl = $('video source').attr('src') || $('video').attr('src') || '';

  // Build a deterministic ID – use the last part of the URL path if possible
  let id = '';
  try {
    const u = new URL(pageUrl);
    const segments = u.pathname.split('/').filter(Boolean);
    id = segments[segments.length - 1] || u.searchParams.get('id') || '';
  } catch {
    // ignore
  }

  if (!title && !artist) {
    // If we cannot find any useful data, treat as not a recording page
    return null;
  }

  const recording: RecordingMeta = {
    id,
    title: title.trim(),
    artist: artist.trim(),
    duration: duration.trim(),
    thumbnail: thumbnail.trim(),
    pageUrl,
    audioUrl: audioUrl ? audioUrl.trim() : undefined,
    videoUrl: videoUrl ? videoUrl.trim() : undefined,
  };

  return recording;
}
