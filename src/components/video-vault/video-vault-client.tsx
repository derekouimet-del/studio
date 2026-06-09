'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { LoaderCircle, Download, Search, Film, FileVideo, AlertTriangle, Link2 } from 'lucide-react';

interface VideoMeta {
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number | null;
  isVideo: boolean;
  isMedia: boolean;
  isHtml: boolean;
  downloadable: boolean;
  supportsRange: boolean;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || Number.isNaN(bytes)) return 'Unknown';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function VideoVaultClient() {
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleInspect = async () => {
    if (!url.trim()) {
      toast({ variant: 'destructive', title: 'Missing URL', description: 'Please paste a video URL first.' });
      return;
    }
    setIsProbing(true);
    setMeta(null);
    try {
      const res = await fetch(`/api/video-download?url=${encodeURIComponent(url.trim())}`);
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
        body: JSON.stringify({ url: target, filename: meta?.filename }),
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

  return (
    <div className="space-y-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="text-primary" /> Video Source URL
          </CardTitle>
          <CardDescription>
            Paste a direct link to a video file. The server fetches and streams the file back to your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">URL</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="video-url"
                placeholder="https://example.com/path/to/video.mp4"
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

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="size-4 mt-0.5 shrink-0 text-primary" />
            <p>
              Works with direct media links (mp4, webm, mov, etc.). Streaming sites that protect content behind player
              manifests or DRM are not supported.
            </p>
          </div>
        </CardContent>
      </Card>

      {meta && (
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
