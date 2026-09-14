// // app/api/download/route.ts
// import { NextResponse } from 'next/server';
// import { spawn } from 'node:child_process';
// import { mkdtemp, rm, writeFile } from 'node:fs/promises';
// import { tmpdir } from 'node:os';
// import { join } from 'node:path';
// import { isAllowedStarMakerMediaUrl } from '@/lib/security/url-validation';

// export const runtime = 'nodejs';

// function mediaCandidates(mediaUrl: string): string[] {
//   const candidates = [mediaUrl];
//   const parsed = new URL(mediaUrl);

//   // Older resolved results may still point at the intermittently unavailable
//   // unversioned host. The versioned CDN mirrors the same public object.
//   if (parsed.hostname === 'static.smintro.com') {
//     for (const hostname of ['static-v7.smintro.com', 'static-v5.smintro.com']) {
//       const fallback = new URL(parsed);
//       fallback.hostname = hostname;
//       candidates.push(fallback.toString());
//     }
//   }
//   return candidates;
// }

// async function convertToMp3(source: ArrayBuffer): Promise<Buffer> {
//   const directory = await mkdtemp(join(tmpdir(), 'starfetch-'));
//   const inputPath = join(directory, 'source.m4a');

//   try {
//     // M4A files commonly store their index at the end, so FFmpeg needs a
//     // seekable temporary input rather than an HTTP or stdin stream.
//     await writeFile(inputPath, Buffer.from(source));

//     return await new Promise((resolve, reject) => {
//     const ffmpeg = spawn(
//       'ffmpeg',
//       [
//         '-hide_banner',
//         '-loglevel', 'error',
//         '-i', inputPath,
//         '-vn',
//         '-codec:a', 'libmp3lame',
//         '-q:a', '2',
//         '-f', 'mp3',
//         'pipe:1',
//       ],
//       { stdio: ['ignore', 'pipe', 'pipe'] },
//     );
//     const chunks: Buffer[] = [];
//     const errors: Buffer[] = [];

//     ffmpeg.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
//     ffmpeg.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
//     ffmpeg.on('error', reject);
//     ffmpeg.on('close', (code) => {
//       if (code === 0) {
//         resolve(Buffer.concat(chunks));
//       } else {
//         reject(new Error(errors.length ? Buffer.concat(errors).toString() : 'Audio conversion failed.'));
//       }
//     });
//     });
//   } finally {
//     await rm(directory, { recursive: true, force: true });
//   }
// }

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const mediaUrl = searchParams.get('url');
//   const filename = searchParams.get('filename') || 'download';
//   const outputFormat = searchParams.get('format');

//   if (!mediaUrl) {
//     return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 });
//   }

//   if (!isAllowedStarMakerMediaUrl(mediaUrl)) {
//     return NextResponse.json({ error: 'Invalid media URL.' }, { status: 400 });
//   }

//   try {
//     let response: Response | undefined;
//     for (const candidate of mediaCandidates(mediaUrl)) {
//       try {
//         const result = await fetch(candidate, { redirect: 'follow', cache: 'no-store' });
//         if (result.ok && isAllowedStarMakerMediaUrl(result.url)) {
//           response = result;
//           break;
//         }
//       } catch {
//         // Try the next public StarMaker CDN host.
//       }
//     }

//     if (!response) {
//       return NextResponse.json({ error: 'Failed to fetch media.' }, { status: 502 });
//     }

//     // Force download with sanitized filename
//     const safeName = filename.replace(/[^a-zA-Z0-9\-_. ]/g, '_');

//     if (outputFormat === 'mp3') {
//       const mp3 = await convertToMp3(await response.arrayBuffer());

//       return new NextResponse(new Uint8Array(mp3), {
//         status: 200,
//         headers: {
//           'Content-Type': 'audio/mpeg',
//           'Content-Disposition': `attachment; filename="${safeName}"`,
//         },
//       });
//     }

//     const headers = new Headers();
//     headers.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
//     headers.set('Content-Disposition', `attachment; filename="${safeName}"`);

//     // Stream the response body directly to the client
//     return new NextResponse(response.body, { status: 200, headers });
//   } catch (error: unknown) {
//     const message = error instanceof Error ? error.message : 'Server error.';
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }



// app/api/download/route.ts

import { NextResponse } from "next/server";
import { isAllowedStarMakerMediaUrl } from "@/lib/security/url-validation";

export const runtime = "nodejs";

function mediaCandidates(mediaUrl: string): string[] {
  const candidates = [mediaUrl];
  const parsed = new URL(mediaUrl);

  // Try versioned StarMaker CDN hosts if the original host fails.
  if (parsed.hostname === "static.smintro.com") {
    for (const hostname of [
      "static-v7.smintro.com",
      "static-v5.smintro.com",
    ]) {
      const fallback = new URL(parsed);
      fallback.hostname = hostname;
      candidates.push(fallback.toString());
    }
  }

  return candidates;
}

function getExtension(contentType: string | null, mediaUrl: string): string {
  const type = (contentType || "").toLowerCase();

  if (type.includes("mpeg") || type.includes("mp3")) {
    return "mp3";
  }

  if (type.includes("mp4")) {
    return "mp4";
  }

  if (type.includes("m4a") || type.includes("mp4a")) {
    return "m4a";
  }

  if (type.includes("aac")) {
    return "aac";
  }

  if (type.includes("webm")) {
    return "webm";
  }

  // Try to determine the extension from the URL.
  try {
    const pathname = new URL(mediaUrl).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);

    if (match) {
      return match[1].toLowerCase();
    }
  } catch {
    // Ignore invalid extension detection.
  }

  return "bin";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mediaUrl = searchParams.get("url");
  const filename = searchParams.get("filename") || "recording";

  if (!mediaUrl) {
    return NextResponse.json(
      { error: "Missing url parameter." },
      { status: 400 }
    );
  }

  if (!isAllowedStarMakerMediaUrl(mediaUrl)) {
    return NextResponse.json(
      { error: "Invalid media URL." },
      { status: 400 }
    );
  }

  try {
    let response: Response | undefined;

    for (const candidate of mediaCandidates(mediaUrl)) {
      try {
        const result = await fetch(candidate, {
          redirect: "follow",
          cache: "no-store",
        });

        if (
          result.ok &&
          result.body &&
          isAllowedStarMakerMediaUrl(result.url)
        ) {
          response = result;
          break;
        }
      } catch {
        // Try the next CDN candidate.
      }
    }

    if (!response || !response.body) {
      return NextResponse.json(
        { error: "Failed to fetch media from StarMaker." },
        { status: 502 }
      );
    }

    // Remove any extension supplied by the frontend.
    const baseFilename = filename
      .replace(/\.[a-zA-Z0-9]+$/, "")
      .replace(/[^a-zA-Z0-9\-_. ]/g, "_")
      .trim() || "recording";

    const extension = getExtension(
      response.headers.get("content-type"),
      response.url
    );

    const finalFilename = `${baseFilename}.${extension}`;

    const headers = new Headers();

    headers.set(
      "Content-Type",
      response.headers.get("content-type") ||
        "application/octet-stream"
    );

    headers.set(
      "Content-Disposition",
      `attachment; filename="${finalFilename}"`
    );

    const contentLength = response.headers.get("content-length");

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("Download error:", error);

    const message =
      error instanceof Error ? error.message : "Server error.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}