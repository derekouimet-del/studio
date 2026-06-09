import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Build an optional ytdl agent from a raw Cookie header string (e.g. copied from a
// logged-in browser session). YouTube blocks anonymous datacenter requests with a
// "Sign in to confirm you're not a bot" error; supplying cookies bypasses that, the
// same way `yt-dlp --cookies` does.
function buildAgent(raw?: string | null) {
  if (!raw || !raw.trim()) return undefined;
  try {
    const cookies = parseCookies(raw);
    if (cookies.length === 0) return undefined;
    return ytdl.createAgent(cookies);
  } catch (error) {
    console.error('[VideoVault] Failed to build cookie agent:', error);
    return undefined;
  }
}

type ParsedCookie = { name: string; value: string; domain: string; path: string };

// Accept cookies in either of two common formats:
//   1. HTTP "Cookie:" header style:  name=value; name2=value2
//   2. Browser DevTools table style: one cookie per line as `name <whitespace> value`,
//      where the value may be wrapped in double quotes.
function parseCookies(raw: string): ParsedCookie[] {
  const text = raw.trim();
  const wrap = (name: string, value: string): ParsedCookie => ({
    name: name.trim(),
    // Strip surrounding quotes that DevTools adds around values.
    value: value.trim().replace(/^"([\s\S]*)"$/, '$1'),
    domain: '.youtube.com',
    path: '/',
  });

  // Detect the DevTools table format: multiple lines, and the first line has no `=`
  // before any tab/whitespace separator (i.e. it looks like `name<tab>value`).
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const looksLikeTable =
    lines.length > 1 &&
    lines.some((l) => /\S\s+\S/.test(l)) &&
    !/^[^=\s]+=/.test(lines[0]);

  if (looksLikeTable) {
    return lines
      .map((line) => {
        // Split on the first run of whitespace (tabs or spaces).
        const match = /^(\S+)\s+([\s\S]+)$/.exec(line);
        if (!match) return null;
        const [, name, value] = match;
        if (!name || !value) return null;
        return wrap(name, value);
      })
      .filter(Boolean) as ParsedCookie[];
  }

  // Otherwise treat it as a standard Cookie header string.
  return text
    .split(';')
    .map((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return null;
      const name = pair.slice(0, idx);
      const value = pair.slice(idx + 1);
      if (!name.trim()) return null;
      return wrap(name, value);
    })
    .filter(Boolean) as ParsedCookie[];
}

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

// Turn an arbitrary title into a filesystem-safe filename.
function sanitizeTitle(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150) || 'video'
  );
}

// ---------------------------------------------------------------------------
// YouTube handling (replicates the yt-dlp behavior from the original app.py)
// ---------------------------------------------------------------------------

// Turn a raw ytdl error into actionable guidance for the user.
function explainYoutubeError(error: unknown, hasCookies: boolean): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('age') || lower.includes('sign in to confirm your age') || lower.includes('inappropriate')) {
    return hasCookies
      ? 'This video is age-restricted. YouTube only releases it to an account that is logged in AND age-verified. Make sure the cookies you pasted are from such an account (and are fresh). Age-restricted videos are blocked far more aggressively from servers, so this can still fail even with valid cookies.'
      : 'This video is age-restricted. You must paste cookies from a logged-in, age-verified YouTube account in the "YouTube cookies" panel below to download it.';
  }
  if (lower.includes('bot') || lower.includes('sign in to confirm')) {
    return hasCookies
      ? 'YouTube is still treating this request as a bot even with cookies. The cookies may be expired or from a different session — re-copy fresh cookies while logged in and try again.'
      : 'YouTube blocked this request as an unverified bot. Paste your logged-in cookies in the "YouTube cookies" panel below to bypass it.';
  }
  if (lower.includes('private')) {
    return 'This video is private and cannot be downloaded.';
  }
  if (lower.includes('unavailable') || lower.includes('not available')) {
    return 'This video is unavailable (it may be removed, region-locked, or members-only).';
  }
  return `Could not read this YouTube video: ${msg}`;
}

async function youtubeMeta(url: string, agent?: ReturnType<typeof ytdl.createAgent>): Promise<NextResponse> {
  const info = await ytdl.getInfo(url, {
    agent,
    playerClients: ['TV', 'WEB_EMBEDDED', 'IOS', 'ANDROID', 'WEB'],
    requestOptions: { headers: { 'User-Agent': BROWSER_UA } },
  });
  const { videoDetails } = info;

  // Prefer a progressive (muxed audio+video) mp4 so the file is immediately playable.
  const progressive = info.formats.filter((f) => f.hasAudio && f.hasVideo);
  const best = progressive.sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];

  const lengthSeconds = Number(videoDetails.lengthSeconds) || null;
  const sizeBytes = best?.contentLength ? Number(best.contentLength) : null;

  return NextResponse.json({
    success: true,
    data: {
      url,
      source: 'youtube',
      filename: `${sanitizeTitle(videoDetails.title)}.mp4`,
      title: videoDetails.title,
      author: videoDetails.author?.name ?? null,
      lengthSeconds,
      thumbnail: videoDetails.thumbnails?.at(-1)?.url ?? null,
      contentType: 'video/mp4',
      sizeBytes,
      qualityLabel: best?.qualityLabel ?? null,
      isVideo: true,
      isMedia: true,
      isHtml: false,
      downloadable: true,
      supportsRange: true,
    },
  });
}

async function youtubeDownload(url: string, agent?: ReturnType<typeof ytdl.createAgent>): Promise<Response> {
  // Resolve metadata first so we can set an accurate filename header, and so we can
  // pick the best progressive (muxed audio+video) mp4 — guaranteeing a playable file.
  // The "TV" and "WEB_EMBEDDED" player clients are the ones most likely to bypass an
  // age-restriction gate, so we list them first.
  const info = await ytdl.getInfo(url, {
    agent,
    playerClients: ['TV', 'WEB_EMBEDDED', 'IOS', 'ANDROID', 'WEB'],
    requestOptions: { headers: { 'User-Agent': BROWSER_UA } },
  });
  const filename = `${sanitizeTitle(info.videoDetails.title)}.mp4`;

  const nodeStream = ytdl.downloadFromInfo(info, {
    quality: 'highest',
    filter: (f) => f.hasAudio && f.hasVideo && f.container === 'mp4',
    agent,
    requestOptions: { headers: { 'User-Agent': BROWSER_UA } },
  });

  // Bridge the Node Readable to a Web ReadableStream for the Response.
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err: Error) => {
        console.error('[VideoVault] YouTube stream error:', err);
        controller.error(err);
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
    },
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

// HEAD-style metadata probe so the client can preview details before downloading
export async function GET(request: NextRequest): Promise<NextResponse> {
  const target = request.nextUrl.searchParams.get('url');

  if (!target || !isValidHttpUrl(target)) {
    return NextResponse.json({ success: false, error: 'A valid http(s) URL is required.' }, { status: 400 });
  }

  // YouTube links are extracted with ytdl-core, not a plain HTTP probe.
  if (ytdl.validateURL(target)) {
    try {
      const cookiesParam = request.nextUrl.searchParams.get('cookies');
      const agent = buildAgent(cookiesParam);
      return await youtubeMeta(target, agent);
    } catch (error) {
      console.error('[VideoVault] YouTube probe error:', error);
      return NextResponse.json(
        {
          success: false,
          error: explainYoutubeError(error, !!request.nextUrl.searchParams.get('cookies')),
        },
        { status: 502 }
      );
    }
  }

  try {
    const probe = await fetch(target, {
      method: 'GET',
      headers: {
        // Request only the first byte to inspect headers cheaply
        Range: 'bytes=0-0',
        'User-Agent': BROWSER_UA,
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
        source: 'direct',
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

// Streaming download — handles YouTube via ytdl-core, otherwise proxies the remote file.
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { url, filename, cookies } = await request.json();

    if (!url || !isValidHttpUrl(url)) {
      return NextResponse.json({ success: false, error: 'A valid http(s) URL is required.' }, { status: 400 });
    }

    // YouTube: extract and stream the muxed mp4.
    if (ytdl.validateURL(url)) {
      try {
        const agent = buildAgent(cookies);
        return await youtubeDownload(url, agent);
      } catch (error) {
        console.error('[VideoVault] YouTube download error:', error);
        return NextResponse.json(
          { success: false, error: explainYoutubeError(error, !!cookies) },
          { status: 502 }
        );
      }
    }

    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': BROWSER_UA,
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, error: `Upstream responded with ${upstream.status} ${upstream.statusText}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';

    // Guard against saving an HTML page (e.g. a non-YouTube social "watch" page) as a video file.
    // A simple proxy cannot extract the underlying stream from those pages, so the result
    // would be an unplayable file. Fail loudly with guidance instead.
    if (contentType.includes('text/html')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'That URL returns a web page, not a video file. Video Vault downloads YouTube links and direct media links (URLs that point straight at an .mp4/.webm/.mov file). Other social sites hide the real stream behind a player and are not supported.',
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
