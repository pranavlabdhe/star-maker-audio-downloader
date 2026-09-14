// app/api/download/route.ts
import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isAllowedStarMakerMediaUrl } from '@/lib/security/url-validation';

export const runtime = 'nodejs';

function mediaCandidates(mediaUrl: string): string[] {
  const candidates = [mediaUrl];
  const parsed = new URL(mediaUrl);

  // Older resolved results may still point at the intermittently unavailable
  // unversioned host. The versioned CDN mirrors the same public object.
  if (parsed.hostname === 'static.smintro.com') {
    for (const hostname of ['static-v7.smintro.com', 'static-v5.smintro.com']) {
      const fallback = new URL(parsed);
      fallback.hostname = hostname;
      candidates.push(fallback.toString());
    }
  }
  return candidates;
}

async function convertToMp3(source: ArrayBuffer): Promise<Buffer> {
  const directory = await mkdtemp(join(tmpdir(), 'starfetch-'));
  const inputPath = join(directory, 'source.m4a');

  try {
    // M4A files commonly store their index at the end, so FFmpeg needs a
    // seekable temporary input rather than an HTTP or stdin stream.
    await writeFile(inputPath, Buffer.from(source));

    return await new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel', 'error',
        '-i', inputPath,
        '-vn',
        '-codec:a', 'libmp3lame',
        '-q:a', '2',
        '-f', 'mp3',
        'pipe:1',
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];

    ffmpeg.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(errors.length ? Buffer.concat(errors).toString() : 'Audio conversion failed.'));
      }
    });
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'download';
  const outputFormat = searchParams.get('format');

  if (!mediaUrl) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 });
  }

  if (!isAllowedStarMakerMediaUrl(mediaUrl)) {
    return NextResponse.json({ error: 'Invalid media URL.' }, { status: 400 });
  }

  try {
    let response: Response | undefined;
    for (const candidate of mediaCandidates(mediaUrl)) {
      try {
        const result = await fetch(candidate, { redirect: 'follow', cache: 'no-store' });
        if (result.ok && isAllowedStarMakerMediaUrl(result.url)) {
          response = result;
          break;
        }
      } catch {
        // Try the next public StarMaker CDN host.
      }
    }

    if (!response) {
      return NextResponse.json({ error: 'Failed to fetch media.' }, { status: 502 });
    }

    // Force download with sanitized filename
    const safeName = filename.replace(/[^a-zA-Z0-9\-_. ]/g, '_');

    if (outputFormat === 'mp3') {
      const mp3 = await convertToMp3(await response.arrayBuffer());

      return new NextResponse(new Uint8Array(mp3), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${safeName}"`);

    // Stream the response body directly to the client
    return new NextResponse(response.body, { status: 200, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
