'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, LoaderCircle, ShieldAlert, Link as LinkIcon, Clipboard, Download } from 'lucide-react';
import { crawlWebsiteAction } from '@/app/actions';
import type { CrawlWebsiteOutput } from '@/ai/flows/web-crawler';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CrawlResult = CrawlWebsiteOutput['pages'][0];
type FoundCredential = CrawlWebsiteOutput['credentials'][0];
const severities = ['all', 'critical', 'high', 'medium', 'low', 'info'] as const;

export function WebCrawlerClient() {
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [maxDepth, setMaxDepth] = useState(1);
  const [maxPages, setMaxPages] = useState(12);
  const [sameOriginOnly, setSameOriginOnly] = useState(true);
  const [severity, setSeverity] = useState<(typeof severities)[number]>('all');
  const [isCrawling, setIsCrawling] = useState(false);
  const [pages, setPages] = useState<CrawlResult[]>([]);
  const [credentials, setCredentials] = useState<FoundCredential[]>([]);
  const { toast } = useToast();
  const visibleCredentials = useMemo(() => credentials.filter((item) => severity === 'all' || item.severity === severity), [credentials, severity]);

  const handleCrawl = async () => {
    if (!targetUrl.trim()) { toast({ variant: 'destructive', title: 'URL required', description: 'Enter a website URL to crawl.' }); return; }
    setIsCrawling(true); setPages([]); setCredentials([]);
    try {
      const response = await crawlWebsiteAction({ targetUrl: targetUrl.trim(), maxDepth, maxPages, sameOriginOnly });
      if (response.success && response.data) {
        setPages(response.data.pages || []); setCredentials(response.data.credentials || []);
        toast({ title: 'Crawl complete', description: `Fetched ${response.data.pages.filter((page) => page.fetched).length} pages and found ${response.data.credentials.length} potential secrets.` });
      } else toast({ variant: 'destructive', title: 'Crawl failed', description: response.error });
    } catch (error) { toast({ variant: 'destructive', title: 'Crawl failed', description: error instanceof Error ? error.message : 'The crawler could not complete the request.' }); }
    finally { setIsCrawling(false); }
  };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copied to clipboard' }); };
  const exportResults = (format: 'json' | 'csv') => {
    const data = format === 'json' ? JSON.stringify({ pages, credentials }, null, 2) : ['source,type,severity,value', ...credentials.map((item) => [item.source, item.type, item.severity, item.value].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `crawl-results.${format}`; link.click(); URL.revokeObjectURL(link.href);
  };
  const severityBadge = (value?: string) => <Badge variant={value === 'critical' || value === 'high' ? 'destructive' : value === 'medium' ? 'secondary' : 'outline'}>{value?.toUpperCase() || 'INFO'}</Badge>;
  const statusVariant = (code: number) => code >= 400 ? 'destructive' : code >= 300 ? 'secondary' : code >= 200 ? 'default' : 'outline';

  return <div className="flex flex-col gap-8">
    <Card><CardHeader><CardTitle>Intelligent Web Crawler</CardTitle><CardDescription>Shallow, same-origin discovery with real status codes and per-page secret classification.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-2 md:flex-row"><Input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} disabled={isCrawling} placeholder="https://example.com" onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229 && !isCrawling) handleCrawl(); }} /><Button onClick={handleCrawl} disabled={isCrawling}>{isCrawling ? <LoaderCircle className="animate-spin" /> : <Bot />} {isCrawling ? 'Crawling...' : 'Start crawl'}</Button></div>
      <div className="flex flex-wrap items-center gap-3 text-sm"><label>Depth <select className="rounded-md border bg-background px-2 py-1" value={maxDepth} onChange={(event) => setMaxDepth(Number(event.target.value))}><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option></select></label><label>Max pages <select className="rounded-md border bg-background px-2 py-1" value={maxPages} onChange={(event) => setMaxPages(Number(event.target.value))}><option value={5}>5</option><option value={12}>12</option><option value={25}>25</option></select></label><label className="flex items-center gap-2"><input type="checkbox" checked={sameOriginOnly} onChange={(event) => setSameOriginOnly(event.target.checked)} /> Same origin only</label></div>
    </CardContent></Card>
    {isCrawling && <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"><LoaderCircle className="size-12 animate-spin text-primary" /><h3 className="text-xl font-semibold">Crawling pages...</h3><p className="text-muted-foreground">Fetching up to {maxPages} pages with four concurrent requests.</p></div>}
    {(pages.length > 0 || credentials.length > 0) && !isCrawling && <div className="grid gap-8 lg:grid-cols-2">
      <Card className={cn(credentials.some((item) => item.severity === 'critical' || item.severity === 'high') && 'border-destructive/50')}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><ShieldAlert /> Findings</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => exportResults('json')}><Download /> JSON</Button><Button variant="outline" size="sm" onClick={() => exportResults('csv')}><Download /> CSV</Button></div></div><CardDescription>{visibleCredentials.length} of {credentials.length} findings shown, with source page context.</CardDescription><div className="flex flex-wrap gap-2">{severities.map((item) => <Button key={item} size="sm" variant={severity === item ? 'default' : 'outline'} onClick={() => setSeverity(item)}>{item}</Button>)}</div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Severity</TableHead><TableHead>Type</TableHead><TableHead>Source / value</TableHead><TableHead /></TableRow></TableHeader><TableBody>{visibleCredentials.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No findings match this filter.</TableCell></TableRow> : visibleCredentials.map((item) => <TableRow key={item.id}><TableCell>{severityBadge(item.severity)}</TableCell><TableCell className="text-xs font-medium">{item.type}</TableCell><TableCell className="max-w-[260px] break-all text-xs"><div>{item.value}</div><div className="text-muted-foreground">{item.source}</div></TableCell><TableCell><Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.value)} aria-label="Copy finding"><Clipboard /></Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon /> Discovered infrastructure</CardTitle><CardDescription>{pages.filter((page) => page.fetched).length} fetched, {pages.filter((page) => !page.fetched).length} discovered but not fetched.</CardDescription></CardHeader><CardContent><div className="max-h-[460px] overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Page</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{pages.map((page) => <TableRow key={page.id}><TableCell className="max-w-[280px] truncate text-xs" title={page.url}><div>{page.title}</div><div className="text-muted-foreground">{page.url}</div></TableCell><TableCell><Badge variant={statusVariant(page.statusCode) as 'default' | 'secondary' | 'destructive' | 'outline'}>{page.statusCode || 'not fetched'}</Badge></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
    </div>}
  </div>;
}
