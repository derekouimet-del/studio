import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Validate that a string is a usable http(s) URL
function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Attempt to derive a reasonable filename from the URL or Content-Disposition header
function deriveFilename(url: string, contentDisposition: string | null, contentType: string | null): string {
  // 1. Try Content-Disposition header
  if (contentDisposition) {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i.exec(contentDisposition);
    if (match?.[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  // 2. Try the URL pathname
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').filter(Boolean).pop();
    if (last && /\.[a-z0-9]{2,4}$/i.test(last)) {
      return decodeURIComponent(last);
    }
  } catch {
    // ignore
  }

  // 3. Fall back to a generated name based on content type
  const ext = contentType?.includes('webm')
    ? 'webm'
    : contentType?.includes('ogg')
      ? 'ogv'
      : contentType?.includes('quicktime')
        ? 'mov'
        : 'mp4';
  return `video-${Date.now()}.${ext}`;
}

// HEAD-style metadata probe so the client can preview details before downloading
export async function GET(request: NextRequest): Promise<NextResponse> {
  const target = request.nextUrl.searchParams.get('url');

  if (!target || !isValidHttpUrl(target)) {
    return NextResponse.json({ success: false, error: 'A valid http(s) URL is required.' }, { status: 400 });
  }

  try {
    const probe = await fetch(target, {
      method: 'GET',
      headers: {
        // Request only the first byte to inspect headers cheaply
        Range: 'bytes=0-0',
        'User-Agent': 'Mozilla/5.0 (compatible; PenQuest-VideoVault/1.0)',
      },
    });

    const contentType = probe.headers.get('content-type');
    const contentRange = probe.headers.get('content-range');
    const contentLength = probe.headers.get('content-length');

    // content-range looks like "bytes 0-0/123456"
    let totalBytes: number | null = null;
    if (contentRange) {
      const total = contentRange.split('/')[1];
      if (total && total !== '*') totalBytes = Number(total);
    } else if (contentLength) {
      totalBytes = Number(contentLength);
    }

    const isVideo = !!contentType && contentType.startsWith('video/');
    const filename = deriveFilename(target, probe.headers.get('content-disposition'), contentType);

    return NextResponse.json({
      success: true,
      data: {
        url: target,
        filename,
        contentType: contentType ?? 'unknown',
        sizeBytes: totalBytes,
        isVideo,
        supportsRange: !!contentRange || probe.headers.get('accept-ranges') === 'bytes',
      },
    });
  } catch (error) {
    console.error('[VideoVault] Probe error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to inspect the URL.' },
      { status: 500 }
    );
  }
}

// Streaming proxy download — pipes the remote video to the browser as an attachment
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { url, filename } = await request.json();

    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json({ success: false, error: 'A valid http(s) URL is required.' }, { status: 400 });
    }

    let originReferer: string | undefined;
    try {
      originReferer = new URL(url).origin;
    } catch {
      originReferer = undefined;
    }

    const upstream = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PenQuest-VideoVault/1.0)',
        Accept: '*/*',
        // Some media hosts reject requests without a same-origin referer
        ...(originReferer ? { Referer: originReferer } : {}),
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, error: `Upstream responded with ${upstream.status} ${upstream.statusText}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    // Guard against saving non-media (e.g. an HTML error/landing page) as a video file,
    // which would otherwise produce a "corrupt" download.
    if (/^(text\/html|application\/xhtml\+xml|text\/plain)/i.test(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The URL did not return a direct video file (it returned a web page). This downloader only supports direct media links, not streaming/player pages.',
        },
        { status: 415 }
      );
    }

    const finalName = (typeof filename === 'string' && filename.trim())
      ? filename.trim()
      : deriveFilename(url, upstream.headers.get('content-disposition'), contentType);

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${finalName.replace(/"/g, '')}"`);
    headers.set('Cache-Control', 'no-store');

    // IMPORTANT: Do NOT forward the upstream Content-Length.
    // `fetch` transparently decompresses gzip/br responses, but the upstream
    // Content-Length reflects the *compressed* size. Forwarding it causes the
    // browser to truncate the download early, producing a corrupt file.
    // Only set it when we are certain the body is not transformed.
    const upstreamEncoding = upstream.headers.get('content-encoding');
    const upstreamLength = upstream.headers.get('content-length');
    if (upstreamLength && !upstreamEncoding) {
      headers.set('Content-Length', upstreamLength);
    }

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('[VideoVault] Download error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to download the video.' },
      { status: 500 }
    );
  }
}
