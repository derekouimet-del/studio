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

// Map a video content-type to a file extension
function extForContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  const ct = contentType.toLowerCase();
  if (ct.includes('mp4')) return 'mp4';
  if (ct.includes('webm')) return 'webm';
  if (ct.includes('quicktime')) return 'mov';
  if (ct.includes('x-matroska') || ct.includes('matroska')) return 'mkv';
  if (ct.includes('x-msvideo')) return 'avi';
  if (ct.includes('x-flv')) return 'flv';
  if (ct.includes('mpeg')) return 'mpeg';
  if (ct.includes('3gpp')) return '3gp';
  if (ct.includes('ogg')) return 'ogv';
  return null;
}

// Determine whether a content-type represents downloadable media (not an HTML page)
function isMediaContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return (
    ct.startsWith('video/') ||
    ct.startsWith('audio/') ||
    ct.includes('mpegurl') || // HLS playlists
    ct.includes('octet-stream') ||
    ct.includes('application/mp4')
  );
}

// Attempt to derive a reasonable filename from the URL or Content-Disposition header,
// always ensuring the extension matches the real content type when known.
function deriveFilename(url: string, contentDisposition: string | null, contentType: string | null): string {
  const realExt = extForContentType(contentType);

  // 1. Try Content-Disposition header
  if (contentDisposition) {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i.exec(contentDisposition);
    if (match?.[1]) {
      return fixExtension(decodeURIComponent(match[1].trim()), realExt);
    }
  }

  // 2. Try the URL pathname
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').filter(Boolean).pop();
    if (last && /\.[a-z0-9]{2,4}$/i.test(last)) {
      return fixExtension(decodeURIComponent(last), realExt);
    }
  } catch {
    // ignore
  }

  // 3. Fall back to a generated name based on content type
  return `video-${Date.now()}.${realExt ?? 'mp4'}`;
}

// Ensure the filename ends with the real extension derived from the content type.
function fixExtension(name: string, realExt: string | null): string {
  if (!realExt) return name;
  const currentExt = /\.([a-z0-9]{2,4})$/i.exec(name)?.[1]?.toLowerCase();
  if (currentExt === realExt) return name;
  // Replace an existing extension, or append if there isn't one.
  const base = currentExt ? name.replace(/\.[a-z0-9]{2,4}$/i, '') : name;
  return `${base}.${realExt}`;
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
    const isMedia = isMediaContentType(contentType);
    const isHtml = !!contentType && contentType.includes('text/html');
    const filename = deriveFilename(target, probe.headers.get('content-disposition'), contentType);

    return NextResponse.json({
      success: true,
      data: {
        url: target,
        filename,
        contentType: contentType ?? 'unknown',
        sizeBytes: totalBytes,
        isVideo,
        isMedia,
        isHtml,
        // A page URL (HTML) cannot be downloaded as a video by a simple proxy.
        downloadable: isMedia,
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

    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PenQuest-VideoVault/1.0)',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, error: `Upstream responded with ${upstream.status} ${upstream.statusText}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    // Guard against saving an HTML page (e.g. a YouTube/social "watch" page) as a video file.
    // A simple proxy cannot extract the underlying stream from those pages, so the result
    // would be an unplayable file. Fail loudly with guidance instead.
    if (contentType.includes('text/html')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'That URL returns a web page, not a video file. Video Vault downloads direct media links (URLs that point straight at an .mp4/.webm/.mov file). Pages like YouTube or social posts hide the real stream behind a player and require a dedicated extractor (yt-dlp), which is not available in this environment.',
        },
        { status: 415 }
      );
    }

    const finalName = (typeof filename === 'string' && filename.trim())
      ? fixExtension(filename.trim(), extForContentType(contentType))
      : deriveFilename(url, upstream.headers.get('content-disposition'), contentType);

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${finalName.replace(/"/g, '')}"`);
    const len = upstream.headers.get('content-length');
    if (len) headers.set('Content-Length', len);

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('[VideoVault] Download error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to download the video.' },
      { status: 500 }
    );
  }
}
