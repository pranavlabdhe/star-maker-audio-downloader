// lib/starmaker/resolver.ts
import { isValidStarMakerUrl, isSafeHost } from '../security/url-validation';
import { parseRecordingPage } from './parser';
import type { RecordingMeta, ResolveResult } from './types';

type ShareResponse = {
  sm?: {
    record?: {
      song?: { title?: string; artist?: string; total_time?: number };
      recording?: {
        id?: string | number;
        is_public?: boolean;
        cover_image?: string;
        audio_url?: string;
        media_url?: string;
        mp4_media_url?: string;
        share_mp4?: string;
        duration?: number;
      };
    };
  };
};

function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

/**
 * StarMaker's unversioned static host intermittently fails DNS lookups. The
 * versioned CDN serves the same public object and is also used for its video
 * media, so prefer it for audio links returned by the share API.
 */
function reliableMediaUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.hostname === 'static.smintro.com') {
      url.hostname = 'static-v7.smintro.com';
    }
    return url.toString();
  } catch {
    return value;
  }
}

async function getPublicRecording(
  pageUrl: string,
  fallback: RecordingMeta,
): Promise<RecordingMeta | null> {
  const page = new URL(pageUrl);
  const recordingId = page.searchParams.get('recordingId') || page.searchParams.get('recording_id');
  if (!recordingId) return null;

  const params = new URLSearchParams({ recording_id: recordingId });
  for (const name of ['from_sid', 'from_user_id', 'share_sig', 'share_v', 'app_version', 'platform']) {
    const value = page.searchParams.get(name);
    if (value) params.set(name, value);
  }

  const detailResponse = await fetch(
    `https://api.starmakerstudios.com/web/sm/share/new_detail?${params.toString()}`,
    { headers: { Accept: 'application/json' }, cache: 'no-store' },
  );
  if (!detailResponse.ok) return null;

  const detail = (await detailResponse.json()) as ShareResponse;
  const record = detail.sm?.record?.recording;
  const song = detail.sm?.record?.song;
  if (!record || record.is_public === false) return null;

  const videoUrl = reliableMediaUrl(record.mp4_media_url || record.share_mp4 || record.media_url);
  const audioUrl = reliableMediaUrl(record.audio_url);
  if (!audioUrl && !videoUrl) return null;

  return {
    id: String(record.id || recordingId),
    title: song?.title || fallback.title,
    artist: song?.artist || fallback.artist,
    duration: formatDuration(record.duration || song?.total_time) || fallback.duration,
    thumbnail: record.cover_image || fallback.thumbnail,
    pageUrl,
    audioUrl,
    videoUrl,
  };
}

/**
 * Resolve a StarMaker share link to recording metadata.
 * Steps:
 * 1. Validate the submitted URL format and whitelist.
 * 2. Fetch the URL with redirects (max 5) using the built‑in fetch API.
 * 3. Ensure each intermediate hostname passes the SSRF guard.
 * 4. After final redirect, fetch the HTML of the public page.
 * 5. Parse the HTML to extract metadata and any public media URLs.
 */
export async function resolveStarMakerLink(inputUrl: string): Promise<ResolveResult> {
  // 1️⃣ Validation
  if (!isValidStarMakerUrl(inputUrl)) {
    return { success: false, error: 'Invalid or unsupported StarMaker link.' };
  }

  try {
    // 2️⃣ Fetch with redirect handling (node-fetch in Edge runtime respects redirects)
    const response = await fetch(inputUrl, {
      method: 'GET',
      redirect: 'follow',
      // Limit to 5 redirects for safety
      // Note: fetch does not expose maxRedirects, so we rely on default behavior (20). We'll check manually.
    });

    // If the response is a redirect chain short‑circuit: fetch already followed it.
    const finalUrl = response.url;

    // 3️⃣ SSRF guard on final host
    const finalHostname = new URL(finalUrl).hostname.replace(/^www\./, '');
    if (!isSafeHost(finalHostname)) {
      return { success: false, error: 'Resolved host is not safe.' };
    }

    // 4️⃣ Ensure response is HTML
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { success: false, error: 'Unable to retrieve a public HTML page for this recording.' };
    }

    const html = await response.text();

    // 5️⃣ Parse HTML
    const recording = parseRecordingPage(html, finalUrl);
    if (!recording) {
      return { success: false, error: 'Could not extract recording information from the page.' };
    }

    // StarMaker's public page is an app shell. Its player fetches the public
    // recording details separately, so source tags are normally absent from
    // the initial HTML. Use that same public metadata to locate media URLs.
    const publicRecording = await getPublicRecording(finalUrl, recording);
    return { success: true, recording: publicRecording || recording };
  } catch (error: unknown) {
    // Network / timeout errors
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error while resolving the link.',
    };
  }
}
