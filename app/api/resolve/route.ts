// app/api/resolve/route.ts
import { NextResponse } from 'next/server';
import { resolveStarMakerLink } from '@/lib/starmaker/resolver';
import { isValidStarMakerUrl } from '@/lib/security/url-validation';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (typeof url !== 'string' || !url) {
      return NextResponse.json({ success: false, error: 'Missing url in request body.' }, { status: 400 });
    }
    // Basic validation – additional checks happen inside resolver
    if (!isValidStarMakerUrl(url)) {
      return NextResponse.json({ success: false, error: 'Invalid or unsupported StarMaker link.' }, { status: 400 });
    }

    const result = await resolveStarMakerLink(url);
    if (result.success) {
      return NextResponse.json({ success: true, recording: result.recording });
    }
    return NextResponse.json({ success: false, error: result.error || 'Unable to resolve recording.' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
