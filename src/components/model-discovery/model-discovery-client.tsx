'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Database, FileUp, KeyRound, Loader2, Search, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface Model { id: string; ownedBy: string | null; created: number | null }
interface LookupResult { url: string; models: Model[]; error?: string }

function normalizeUrls(value: string) {
  return [...new Set(value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
}

export function ModelDiscoveryClient() {
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [batchInput, setBatchInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [batchResults, setBatchResults] = useState<LookupResult[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function selectProvider(value: string) {
    const next = value as 'openai' | 'anthropic';
    setProvider(next);
    setBaseUrl(next === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1');
    setModels([]); setBatchResults([]); setError('');
  }

  async function lookup(url: string): Promise<Model[]> {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost') || hostname.endsWith('.internal') || /^(10|192\.168|169\.254)\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
    const path = parsedUrl.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/models')) parsedUrl.pathname = `${path.endsWith('/v1') ? path : `${path}/v1`}/models`;
    parsedUrl.search = ''; parsedUrl.hash = '';
    let response: Response;
    if (isLocal) {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (provider === 'openai' && apiKey) headers.Authorization = `Bearer ${apiKey}`;
      if (provider === 'anthropic') { if (apiKey) headers['x-api-key'] = apiKey; headers['anthropic-version'] = '2023-06-01'; }
      response = await fetch(parsedUrl.toString(), { headers, signal: AbortSignal.timeout(15_000) });
    } else {
      response = await fetch('/api/model-discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, baseUrl: url, apiKey }) });
    }
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `Endpoint returned HTTP ${response.status}.`);
    const discovered = Array.isArray(payload.models) ? payload.models : Array.isArray(payload.data) ? payload.data : [];
    return discovered.map((model: { id?: string; name?: string; owned_by?: string; ownedBy?: string; created?: number }) => ({ id: String(model.id ?? model.name ?? ''), ownedBy: model.owned_by ?? model.ownedBy ?? null, created: model.created ?? null })).filter((model: Model) => model.id);
  }

  async function discover(event?: FormEvent) {
    event?.preventDefault();
    const urls = normalizeUrls(batchInput || baseUrl);
    setLoading(true); setError(''); setModels([]); setBatchResults([]);
    if (!urls.length) { setError('Enter at least one base URL.'); setLoading(false); return; }
    const results = await Promise.all(urls.map(async (url): Promise<LookupResult> => {
      try { return { url, models: await lookup(url) }; }
      catch (reason) { return { url, models: [], error: reason instanceof Error && reason.name === 'TimeoutError' ? 'The endpoint took too long to respond.' : reason instanceof Error ? reason.message : 'Could not retrieve models.' }; }
    }));
    setBatchResults(results);
    if (urls.length === 1 && !results[0].error) setModels(results[0].models);
    if (results.every((result) => result.error)) setError('Every lookup failed. Check the URLs, credentials, and whether the endpoints allow requests from a hosted server.');
    setLoading(false);
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setBatchInput(await file.text());
    event.target.value = '';
  }

  const totalModels = batchResults.reduce((sum, result) => sum + result.models.length, 0);
  return <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
    <Card className="h-fit"><CardHeader><div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><Search /></div><CardTitle>Model Discovery</CardTitle><CardDescription>Inspect one or many OpenAI or Anthropic-compatible API endpoints.</CardDescription></CardHeader><CardContent><form onSubmit={discover} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2"><Label>Endpoint type</Label><Tabs value={provider} onValueChange={selectProvider}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="openai">OpenAI compatible</TabsTrigger><TabsTrigger value="anthropic">Anthropic compatible</TabsTrigger></TabsList><TabsContent value="openai" className="mt-2 text-xs text-muted-foreground">Queries <code>/v1/models</code> with Bearer authentication.</TabsContent><TabsContent value="anthropic" className="mt-2 text-xs text-muted-foreground">Queries <code>/v1/models</code> with Anthropic headers.</TabsContent></Tabs></div>
      <div className="flex flex-col gap-2"><Label htmlFor="base-url">Base URL</Label><Input id="base-url" type="url" value={baseUrl} onChange={(event) => { setBaseUrl(event.target.value); setBatchInput(''); }} placeholder="https://api.example.com/v1" required /><p className="text-xs text-muted-foreground">For a batch, paste one base URL per line below.</p></div>
      <div className="flex flex-col gap-2"><Label htmlFor="batch-input">Batch URLs <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="batch-input" value={batchInput} onChange={(event) => setBatchInput(event.target.value)} placeholder={'https://api.openai.com/v1\nhttps://my-provider.example/v1'} rows={5} /><div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{normalizeUrls(batchInput).length} URL{normalizeUrls(batchInput).length === 1 ? '' : 's'} ready</p><label htmlFor="url-file" className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline"><FileUp className="size-3.5" /> Upload .txt</label><input id="url-file" type="file" accept=".txt,text/plain" className="sr-only" onChange={importFile} /></div></div>
      <div className="flex flex-col gap-2"><Label htmlFor="api-key">API key <span className="font-normal text-muted-foreground">(optional)</span></Label><div className="relative"><KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="pl-9" placeholder="sk-…" autoComplete="off" /></div><p className="text-xs text-muted-foreground">Used only for these requests and never stored.</p></div>
      <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Database data-icon="inline-start" />}{loading ? 'Checking endpoints…' : batchInput ? `Discover ${normalizeUrls(batchInput).length} endpoint${normalizeUrls(batchInput).length === 1 ? '' : 's'}` : 'Discover models'}</Button>
    </form></CardContent></Card>
    <Card className="min-h-[420px]"><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Available models</CardTitle><CardDescription>{batchResults.length > 1 ? `${totalModels} model${totalModels === 1 ? '' : 's'} found across ${batchResults.length} endpoints.` : models.length ? `${models.length} model${models.length === 1 ? '' : 's'} returned by the endpoint.` : 'Results will appear here after a successful lookup.'}</CardDescription></div>{totalModels > 0 || models.length > 0 ? <Badge variant="secondary"><CheckCircle2 className="mr-1 size-3" /> Connected</Badge> : null}</CardHeader><CardContent>
      {error && <Alert variant="destructive" className="mb-5"><AlertCircle /><AlertTitle>Lookup failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {loading && <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-muted-foreground"><Loader2 className="size-8 animate-spin text-primary" /><p>Requesting models from {normalizeUrls(batchInput || baseUrl).length} endpoint{normalizeUrls(batchInput || baseUrl).length === 1 ? '' : 's'}…</p></div>}
      {!loading && !error && batchResults.length === 0 && <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center text-muted-foreground"><Database className="size-10 opacity-40" /><p className="max-w-sm text-sm">Enter one URL, paste a list, or upload a text file to see the available model IDs.</p></div>}
      {!loading && batchResults.length > 0 && <div className="grid gap-4">{batchResults.map((result) => <section key={result.url} className="rounded-lg border bg-background/40 p-4"><div className="mb-3 flex items-start justify-between gap-3"><p className="min-w-0 truncate font-mono text-xs text-muted-foreground">{result.url}</p><Badge variant={result.error ? 'destructive' : 'outline'}>{result.error ? 'Failed' : `${result.models.length} models`}</Badge></div>{result.error ? <p className="text-sm text-destructive">{result.error}</p> : <div className="grid gap-2">{result.models.map((model) => <div key={`${result.url}-${model.id}`} className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"><p className="truncate font-mono text-sm">{model.id}</p><Button variant="ghost" size="icon" aria-label={`Copy ${model.id}`} onClick={() => navigator.clipboard?.writeText(model.id)}><Copy /></Button></div>)}</div>}</section>)}</div>}
    </CardContent></Card>
  </div>;
}
