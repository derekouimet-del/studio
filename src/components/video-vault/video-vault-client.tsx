'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { LoaderCircle, Download, Search, Film, FileVideo, AlertTriangle, Link2, Sparkles } from 'lucide-react';

interface VideoMeta {
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number | null;
  isVideo: boolean;
  supportsRange: boolean;
}

interface VideoFormat {
  format_id: string;
  ext: string | null;
  resolution: string | null;
  height: number | null;
  fps: number | null;
  filesize: number | null;
  vcodec: string | null;
  acodec: string | null;
  has_video: boolean;
  has_audio: boolean;
  note: string | null;
}

interface ExtractMeta {
  title: string | null;
  uploader: string | null;
  duration: number | null;
  thumbnail: string | null;
  extractor: string | null;
  webpage_url: string;
  is_live: boolean;
  formats: VideoFormat[];
}

// Hosts that never serve direct media files and require extraction (yt-dlp)
const STREAMING_HOSTS = [
  'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'tiktok.com',
  'instagram.com', 'facebook.com', 'fb.watch', 'twitter.com', 'x.com',
  'twitch.tv', 'reddit.com', 'streamable.com', 'rumble.com', 'bilibili.com',
];

function isStreamingSite(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '').toLowerCase();
    return STREAMING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return 'Unknown';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds || Number.isNaN(seconds)) return 'Unknown';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function describeFormat(f: VideoFormat): string {
  const parts: string[] = [];
  parts.push(f.resolution || (f.height ? `${f.height}p` : f.ext || f.format_id));
  if (f.fps) parts.push(`${f.fps}fps`);
  if (!f.has_audio && f.has_video) parts.push('video only');
  if (!f.has_video && f.has_audio) parts.push('audio only');
  if (f.ext) parts.push(f.ext);
  if (f.filesize) parts.push(formatBytes(f.filesize));
  return parts.join(' · ');
}

export function VideoVaultClient() {
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'direct' | 'extract'>('direct');

  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [extractMeta, setExtractMeta] = useState<ExtractMeta | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  const [isProbing, setIsProbing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const resetResults = () => {
    setMeta(null);
    setExtractMeta(null);
    setSelectedFormat('');
  };

  const inspectDirect = async (target: string) => {
    const res = await fetch(`/api/video-download?url=${encodeURIComponent(target)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to inspect URL.');
    setMode('direct');
    setMeta(json.data);
    if (!json.data.isVideo) {
      toast({
        title: 'Not a direct video',
        description: 'This may be a player page. Try "Smart Extract" to pull the media with yt-dlp.',
      });
    } else {
      toast({ title: 'Source Found', description: 'Video details loaded below.' });
    }
  };

  const inspectExtract = async (target: string) => {
    const res = await fetch(`/api/video-fetch?url=${encodeURIComponent(target)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to extract video info.');
    const data = json.data as ExtractMeta;
    setMode('extract');
    setExtractMeta(data);
    // Default to the best combined/highest format yt-dlp will merge automatically
    setSelectedFormat('best');
    toast({ title: 'Media Extracted', description: data.title ? `Found: ${data.title}` : 'Video details loaded below.' });
  };

  const runInspect = async (forceExtract: boolean) => {
    const target = url.trim();
    if (!target) {
      toast({ variant: 'destructive', title: 'Missing URL', description: 'Please paste a video URL first.' });
      return;
    }
    setIsProbing(true);
    resetResults();
    try {
      if (forceExtract || isStreamingSite(target)) {
        await inspectExtract(target);
      } else {
        await inspectDirect(target);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: forceExtract ? 'Extraction Failed' : 'Inspection Failed',
        description: error instanceof Error ? error.message : 'Could not read the URL.',
      });
    } finally {
      setIsProbing(false);
    }
  };

  const triggerBrowserDownload = (blob: Blob, name: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  const handleDirectDownload = async () => {
    const target = meta?.url ?? url.trim();
    if (!target) return;
    setIsDownloading(true);
    try {
      const res = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target, filename: meta?.filename }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Download failed (${res.status}).`);
      }
      const blob = await res.blob();
      triggerBrowserDownload(blob, meta?.filename || `video-${Date.now()}.mp4`);
      toast({ title: 'Download Started', description: 'Your video has been saved.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download the video.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExtractDownload = async () => {
    if (!extractMeta) return;
    setIsDownloading(true);
    try {
      const res = await fetch('/api/video-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: extractMeta.webpage_url,
          formatId: selectedFormat && selectedFormat !== 'best' ? selectedFormat : undefined,
        }),
      });
      if (!res.ok || (res.headers.get('content-type') || '').includes('application/json')) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Download failed (${res.status}).`);
      }
      const blob = await res.blob();
      const safeTitle = (extractMeta.title || 'video').replace(/[^\w.\- ]+/g, '_').slice(0, 100);
      triggerBrowserDownload(blob, `${safeTitle}.mp4`);
      toast({ title: 'Download Started', description: 'Your video has been saved.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download the video.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const showStreamingHint = isStreamingSite(url);

  return (
    <div className="space-y-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="text-primary" /> Video Source URL
          </CardTitle>
          <CardDescription>
            Paste a direct media link, or a page from YouTube and other sites to extract the video with yt-dlp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">URL</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=... or https://site.com/video.mp4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runInspect(false);
                }}
                className="font-code"
              />
              <Button onClick={() => runInspect(false)} disabled={isProbing}>
                {isProbing ? <LoaderCircle className="animate-spin" /> : <Search />}
                Inspect
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => runInspect(true)}
              disabled={isProbing}
              className="w-full sm:w-auto"
            >
              <Sparkles className="size-4" />
              Smart Extract (yt-dlp)
            </Button>
            <p className="text-sm text-muted-foreground">
              Use Smart Extract for YouTube, Vimeo, TikTok, and other streaming sites.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="size-4 mt-0.5 shrink-0 text-primary" />
            <p>
              {showStreamingHint
                ? 'This looks like a streaming site — use Smart Extract. It runs yt-dlp on your scanner service to pull and mux the real video. Only download content you own or have rights to.'
                : 'Direct links (mp4, webm, mov) download instantly. For player pages or streaming sites, use Smart Extract.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Direct download details */}
      {mode === 'direct' && meta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="text-primary" /> Source Details
            </CardTitle>
            <CardDescription className="break-all">{meta.url}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex items-center justify-between sm:block">
                <dt className="text-muted-foreground">Filename</dt>
                <dd className="font-code font-medium break-all sm:mt-1">{meta.filename}</dd>
              </div>
              <div className="flex items-center justify-between sm:block">
                <dt className="text-muted-foreground">Content Type</dt>
                <dd className="font-code font-medium sm:mt-1">{meta.contentType}</dd>
              </div>
              <div className="flex items-center justify-between sm:block">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-code font-medium sm:mt-1">{formatBytes(meta.sizeBytes)}</dd>
              </div>
              <div className="flex items-center justify-between sm:block">
                <dt className="text-muted-foreground">Detected Video</dt>
                <dd className="font-code font-medium sm:mt-1">{meta.isVideo ? 'Yes' : 'Uncertain'}</dd>
              </div>
            </dl>
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col items-stretch gap-3 pt-6 sm:flex-row sm:items-center">
            <Button onClick={handleDirectDownload} disabled={isDownloading} className="w-full sm:w-auto">
              {isDownloading ? <LoaderCircle className="animate-spin" /> : <Download />}
              {isDownloading ? 'Downloading...' : 'Download Video'}
            </Button>
            {!meta.isVideo && (
              <Button
                variant="outline"
                onClick={() => runInspect(true)}
                disabled={isProbing || isDownloading}
                className="w-full sm:w-auto"
              >
                <Sparkles className="size-4" />
                Try Smart Extract instead
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Extracted (yt-dlp) details */}
      {mode === 'extract' && extractMeta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" /> Extracted Media
            </CardTitle>
            <CardDescription className="break-all">{extractMeta.webpage_url}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              {extractMeta.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={extractMeta.thumbnail || '/placeholder.svg'}
                  alt={extractMeta.title ? `Thumbnail for ${extractMeta.title}` : 'Video thumbnail'}
                  className="w-full sm:w-48 aspect-video rounded-lg border border-border object-cover"
                  crossOrigin="anonymous"
                />
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-balance">{extractMeta.title || 'Untitled video'}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {extractMeta.uploader && <span>{extractMeta.uploader}</span>}
                  {extractMeta.duration ? <span>· {formatDuration(extractMeta.duration)}</span> : null}
                  {extractMeta.extractor && <Badge variant="secondary">{extractMeta.extractor}</Badge>}
                  {extractMeta.is_live && <Badge variant="destructive">Live</Badge>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format-select">Quality / Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger id="format-select" className="font-code">
                  <SelectValue placeholder="Select a format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best available (auto-merge to mp4)</SelectItem>
                  {extractMeta.formats
                    .filter((f) => f.has_video || f.has_audio)
                    .slice()
                    .reverse()
                    .map((f) => (
                      <SelectItem key={f.format_id} value={f.format_id} className="font-code">
                        {describeFormat(f)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {'"Best available" lets yt-dlp pick the highest-quality video + audio and mux them together.'}
              </p>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="pt-6">
            <Button onClick={handleExtractDownload} disabled={isDownloading || extractMeta.is_live} className="w-full sm:w-auto">
              {isDownloading ? <LoaderCircle className="animate-spin" /> : <Download />}
              {isDownloading ? 'Downloading...' : extractMeta.is_live ? 'Live streams not supported' : 'Download Video'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!meta && !extractMeta && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-12 text-center text-muted-foreground">
          <FileVideo className="size-12" />
          <p>Inspect a URL to preview video details before downloading.</p>
        </div>
      )}
    </div>
  );
}
