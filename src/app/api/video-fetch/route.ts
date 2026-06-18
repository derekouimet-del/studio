import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Self-hosted PenQuest scanner service (runs yt-dlp + ffmpeg)
const SCANNER_API_URL = process.env.SCANNER_API_URL || process.env.NEXT_PUBLIC_SCANNER_API_URL;
const SCANNER_API_KEY = process.env.SCANNER_API_KEY;

function scannerHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SCANNER_API_KEY) headers['X-API-Key'] = SCANNER_API_KEY;
  return headers;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const NOT_CONFIGURED =
  'Video extraction requires the self-hosted scanner service. Set SCANNER_API_URL and run penquest-scanner-service.py with yt-dlp installed.';

// GET — probe a URL for metadata + available formats (proxies /video-info)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const target = request.nextUrl.searchParams.get('url');

  if (!target || !isValidHttpUrl(target)) {
    return NextResponse.json({ success: false, error: 'A valid http(s) URL is required.' }, { status: 400 });
  }
  if (!SCANNER_API_URL) {
    return NextResponse.json({ success: false, error: NOT_CONFIGURED }, { status: 503 });
  }

  try {
    const res = await fetch(`${SCANNER_API_URL}/video-info`, {
      method: 'POST',
      headers: scannerHeaders(),
      body: JSON.stringify({ url: target }),
    });

    const json = await res.json().catch(() => ({ success: false, error: 'Invalid response from scanner service.' }));

    if (res.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The /video-info endpoint is not available on your scanner service. Update penquest-scanner-service.py to the latest version and restart it.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(json, { status: res.ok ? 200 : res.status });
  } catch (error) {
    console.error('[VideoFetch] Info error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error && error.message.includes('fetch')
            ? 'Could not reach the scanner service. Is it running and reachable at SCANNER_API_URL?'
            : error instanceof Error
              ? error.message
              : 'Failed to inspect the URL.',
      },
      { status: 502 }
    );
  }
}

// POST — extract + download the video, streaming the file back (proxies /video-download)
export async function POST(request: NextRequest): Promise<Response> {
  if (!SCANNER_API_URL) {
    return NextResponse.json({ success: false, error: NOT_CONFIGURED }, { status: 503 });
  }

  try {
    const { url, formatId, filename } = await request.json();

    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json({ success: false, error: 'A valid http(s) URL is required.' }, { status: 400 });
    }

    const upstream = await fetch(`${SCANNER_API_URL}/video-download`, {
      method: 'POST',
      headers: scannerHeaders(),
      body: JSON.stringify({ url, format_id: formatId }),
    });

    // Errors come back as JSON; success comes back as a file stream
    const contentType = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || contentType.includes('application/json') || !upstream.body) {
      const json = await upstream
        .json()
        .catch(() => ({ success: false, error: `Scanner service returned ${upstream.status}.` }));
      return NextResponse.json(json, { status: upstream.ok ? 502 : upstream.status });
    }

    const upstreamDisposition = upstream.headers.get('content-disposition');
    const finalName =
      (typeof filename === 'string' && filename.trim()) || undefined;

    const headers = new Headers();
    headers.set('Content-Type', contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'no-store');
    if (finalName) {
      headers.set('Content-Disposition', `attachment; filename="${finalName.replace(/"/g, '')}"`);
    } else if (upstreamDisposition) {
      headers.set('Content-Disposition', upstreamDisposition);
    } else {
      headers.set('Content-Disposition', `attachment; filename="video-${Date.now()}.mp4"`);
    }

    // Forward Content-Length only when present and untransformed (the scanner sends a finished file)
    const len = upstream.headers.get('content-length');
    const enc = upstream.headers.get('content-encoding');
    if (len && !enc) headers.set('Content-Length', len);

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('[VideoFetch] Download error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error && error.message.includes('fetch')
            ? 'Could not reach the scanner service. Is it running and reachable at SCANNER_API_URL?'
            : error instanceof Error
              ? error.message
              : 'Failed to download the video.',
      },
      { status: 502 }
    );
  }
}
