'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import {
  LoaderCircle,
  Download,
  Search,
  Film,
  FileVideo,
  AlertTriangle,
  Link2,
  Youtube,
  ChevronDown,
  Cookie,
  Clock,
  User,
} from 'lucide-react';

interface VideoMeta {
  url: string;
  source?: 'youtube' | 'direct';
  filename: string;
  contentType: string;
  sizeBytes: number | null;
  isVideo: boolean;
  isMedia: boolean;
  isHtml: boolean;
  downloadable: boolean;
  supportsRange: boolean;
  // YouTube-only fields
  title?: string;
  author?: string | null;
  lengthSeconds?: number | null;
  thumbnail?: string | null;
  qualityLabel?: string | null;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || Number.isNaN(bytes)) return 'Unknown';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || Number.isNaN(seconds)) return 'Unknown';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function VideoVaultClient() {
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [cookies, setCookies] = useState('');
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(url);

  const handleInspect = async () => {
    if (!url.trim()) {
      toast({ variant: 'destructive', title: 'Missing URL', description: 'Please paste a video URL first.' });
      return;
    }
    setIsProbing(true);
    setMeta(null);
    try {
      const params = new URLSearchParams({ url: url.trim() });
      if (cookies.trim()) params.set('cookies', cookies.trim());
      const res = await fetch(`/api/video-download?${params.toString()}`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to inspect URL.');
      }
      setMeta(json.data);
      if (json.data.isHtml) {
        toast({
          variant: 'destructive',
          title: 'Not a video file',
          description:
            'That URL returns a web page, not a direct media file. Paste a link that points straight at the video (e.g. ending in .mp4).',
        });
      } else if (!json.data.downloadable) {
        toast({
          title: 'Heads up',
          description: `The URL reports content type "${json.data.contentType}". It may not be a downloadable video file.`,
        });
      } else {
        toast({ title: 'Source Found', description: 'Video details loaded below.' });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Inspection Failed',
        description: error instanceof Error ? error.message : 'Could not read the URL.',
      });
    } finally {
      setIsProbing(false);
    }
  };

  const handleDownload = async () => {
    const target = meta?.url ?? url.trim();
    if (!target) return;

    setIsDownloading(true);
    try {
      const res = await fetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target, filename: meta?.filename, cookies: cookies.trim() || undefined }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Download failed (${res.status}).`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = meta?.filename || `video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

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

  const isYouTubeMeta = meta?.source === 'youtube';

  return (
    <div className="space-y-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="text-primary" /> Video Source URL
          </CardTitle>
          <CardDescription>
            Paste a YouTube link or a direct video file URL. The server extracts and streams the video back to your
            browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">URL</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInspect();
                }}
                className="font-code"
              />
              <Button onClick={handleInspect} disabled={isProbing}>
                {isProbing ? <LoaderCircle className="animate-spin" /> : <Search />}
                Inspect
              </Button>
            </div>
          </div>

          {isYouTube && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Cookie className="size-4" />
                  YouTube cookies (optional)
                  <ChevronDown className="size-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-2">
                <Label htmlFor="yt-cookies">Cookies</Label>
                <Textarea
                  id="yt-cookies"
                  placeholder={'SID="..."  __Secure-3PSID="..."  LOGIN_INFO="..."\n\u2014 or \u2014\nSID=...; __Secure-3PSID=...; LOGIN_INFO=...'}
                  value={cookies}
                  onChange={(e) => setCookies(e.target.value)}
                  className="font-code text-xs min-h-24"
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  YouTube blocks anonymous server requests with a {'"'}Sign in to confirm you{'\u2019'}re not a bot{'"'}{' '}
                  error. To bypass it, open YouTube while logged in and paste your cookies here. Two formats are
                  accepted: the raw <span className="font-code">Cookie</span> request header (
                  <span className="font-code">name=value; name=value</span>), or the DevTools{' '}
                  <span className="font-code">Application {'\u2192'} Cookies</span> table pasted directly (one{' '}
                  <span className="font-code">name{'\t'}value</span> per line). This works the same way as{' '}
                  <span className="font-code">yt-dlp --cookies</span>.
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="size-4 mt-0.5 shrink-0 text-primary" />
            <p>
              Supports YouTube links and direct media URLs (mp4, webm, mov, etc.). Other streaming sites that protect
              content behind player manifests or DRM are not supported.
            </p>
          </div>
        </CardContent>
      </Card>

      {meta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isYouTubeMeta ? <Youtube className="text-primary" /> : <Film className="text-primary" />}
              {isYouTubeMeta ? 'Video Details' : 'Source Details'}
            </CardTitle>
            <CardDescription className="break-all">{meta.title ?? meta.url}</CardDescription>
          </CardHeader>
          <CardContent>
            {isYouTubeMeta && meta.thumbnail && (
              <div className="mb-6 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meta.thumbnail || '/placeholder.svg'}
                  alt={meta.title ? `Thumbnail for ${meta.title}` : 'Video thumbnail'}
                  className="w-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex items-center justify-between sm:block">
                <dt className="text-muted-foreground">Filename</dt>
                <dd className="font-code font-medium break-all sm:mt-1">{meta.filename}</dd>
              </div>
              {isYouTubeMeta && meta.author && (
                <div className="flex items-center justify-between sm:block">
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <User className="size-3" /> Channel
                  </dt>
                  <dd className="font-medium sm:mt-1">{meta.author}</dd>
                </div>
              )}
              {isYouTubeMeta && (
                <div className="flex items-center justify-between sm:block">
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" /> Duration
                  </dt>
                  <dd className="font-code font-medium sm:mt-1">{formatDuration(meta.lengthSeconds)}</dd>
                </div>
              )}
              {isYouTubeMeta && meta.qualityLabel && (
                <div className="flex items-center justify-between sm:block">
                  <dt className="text-muted-foreground">Quality</dt>
                  <dd className="font-code font-medium sm:mt-1">{meta.qualityLabel}</dd>
                </div>
              )}
              <div className="flex items-center justify-between sm:block">
                <dt className="text-muted-foreground">Content Type</dt>
                <dd className="font-code font-medium sm:mt-1">{meta.contentType}</dd>
              </div>
              <div className="flex items-center justify-between sm:block">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-code font-medium sm:mt-1">{formatBytes(meta.sizeBytes)}</dd>
              </div>
            </dl>
            {!meta.downloadable && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
                <p className="text-foreground">
                  {meta.isHtml
                    ? 'This URL points to a web page, not a direct video file. Downloading it would save the page\u2019s HTML, which is not playable. Use a link that points straight at the media file.'
                    : `This content type (${meta.contentType}) does not look like a downloadable media file. The download may not be playable.`}
                </p>
              </div>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="pt-6">
            <Button
              onClick={handleDownload}
              disabled={isDownloading || !meta.downloadable}
              className="w-full sm:w-auto"
            >
              {isDownloading ? <LoaderCircle className="animate-spin" /> : <Download />}
              {isDownloading ? 'Downloading...' : 'Download Video'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!meta && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-12 text-center text-muted-foreground">
          <FileVideo className="size-12" />
          <p>Inspect a URL to preview video details before downloading.</p>
        </div>
      )}
    </div>
  );
}
