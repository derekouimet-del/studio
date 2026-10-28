'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Database, KeyRound, Loader2, RefreshCw, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Model { id: string; ownedBy: string | null; created: number | null }

export function ModelDiscoveryClient() {
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function selectProvider(value: string) {
    const next = value as 'openai' | 'anthropic';
    setProvider(next);
    setBaseUrl(next === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1');
    setModels([]);
    setError('');
  }

  async function discover(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true); setError(''); setModels([]);
    try {
      const parsedUrl = new URL(baseUrl);
      const hostname = parsedUrl.hostname.toLowerCase();
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost') || hostname.endsWith('.internal') || /^(10|192\.168|169\.254)\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
      const path = parsedUrl.pathname.replace(/\/+$/, '');
      if (!path.endsWith('/models')) parsedUrl.pathname = `${path.endsWith('/v1') ? path : `${path}/v1`}/models`;
      parsedUrl.search = '';
      parsedUrl.hash = '';

      let response: Response;
      if (isLocal) {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (provider === 'openai' && apiKey) headers.Authorization = `Bearer ${apiKey}`;
        if (provider === 'anthropic') {
          if (apiKey) headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        }
        response = await fetch(parsedUrl.toString(), { headers, signal: AbortSignal.timeout(15_000) });
      } else {
        response = await fetch('/api/model-discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, baseUrl, apiKey }) });
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Endpoint returned HTTP ${response.status}.`);
      const discovered = Array.isArray(payload.models) ? payload.models : Array.isArray(payload.data) ? payload.data : [];
      setModels(discovered.map((model: { id?: string; name?: string; owned_by?: string; ownedBy?: string; created?: number }) => ({ id: String(model.id ?? model.name ?? ''), ownedBy: model.owned_by ?? model.ownedBy ?? null, created: model.created ?? null })).filter((model: Model) => model.id));
    } catch (reason) {
      const message = reason instanceof TypeError && baseUrl.includes('localhost')
        ? 'Your local endpoint rejected the browser request (CORS). Allow this site in its CORS settings, or expose the endpoint over HTTPS.'
        : reason instanceof Error && reason.name === 'TimeoutError'
          ? 'The endpoint took too long to respond.'
          : reason instanceof Error ? reason.message : 'Could not retrieve models.';
      setError(message);
    }
    finally { setLoading(false); }
  }

  return <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
    <Card className="h-fit">
      <CardHeader><div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><Search /></div><CardTitle>Model Discovery</CardTitle><CardDescription>Inspect the models exposed by any OpenAI or Anthropic-compatible API endpoint.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={discover} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2"><Label>Endpoint type</Label><Tabs value={provider} onValueChange={selectProvider}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="openai">OpenAI compatible</TabsTrigger><TabsTrigger value="anthropic">Anthropic compatible</TabsTrigger></TabsList><TabsContent value="openai" className="mt-2 text-xs text-muted-foreground">Queries <code>/v1/models</code> with Bearer authentication.</TabsContent><TabsContent value="anthropic" className="mt-2 text-xs text-muted-foreground">Queries <code>/v1/models</code> with Anthropic headers.</TabsContent></Tabs></div>
          <div className="flex flex-col gap-2"><Label htmlFor="base-url">Base URL</Label><Input id="base-url" type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.example.com/v1" required /><p className="text-xs text-muted-foreground">The tool appends <code>/models</code> when needed.</p></div>
          <div className="flex flex-col gap-2"><Label htmlFor="api-key">API key <span className="font-normal text-muted-foreground">(optional)</span></Label><div className="relative"><KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="pl-9" placeholder="sk-…" autoComplete="off" /></div><p className="text-xs text-muted-foreground">Used only for this request and never stored.</p></div>
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Database data-icon="inline-start" />}{loading ? 'Checking endpoint…' : 'Discover models'}</Button>
        </form>
      </CardContent>
    </Card>
    <Card className="min-h-[420px]"><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Available models</CardTitle><CardDescription>{models.length ? `${models.length} model${models.length === 1 ? '' : 's'} returned by the endpoint.` : 'Results will appear here after a successful lookup.'}</CardDescription></div>{models.length > 0 && <Badge variant="secondary"><CheckCircle2 className="mr-1 size-3" /> Connected</Badge>}</CardHeader><CardContent>
      {error && <Alert variant="destructive" className="mb-5"><AlertCircle /><AlertTitle>Lookup failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {loading && <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-muted-foreground"><Loader2 className="size-8 animate-spin text-primary" /><p>Requesting the models endpoint…</p></div>}
      {!loading && !error && models.length === 0 && <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center text-muted-foreground"><Database className="size-10 opacity-40" /><p className="max-w-sm text-sm">Enter an endpoint and run a lookup to see its model IDs, ownership, and metadata.</p></div>}
      {!loading && models.length > 0 && <div className="grid gap-2">{models.map((model) => <div key={model.id} className="flex items-center justify-between gap-4 rounded-md border bg-background/40 px-4 py-3"><div className="min-w-0"><p className="truncate font-mono text-sm">{model.id}</p>{model.ownedBy && <p className="truncate text-xs text-muted-foreground">Owned by {model.ownedBy}</p>}</div><Button variant="ghost" size="icon" aria-label={`Copy ${model.id}`} onClick={() => navigator.clipboard?.writeText(model.id)}><Copy /></Button></div>)}</div>}
      {!loading && !error && models.length === 0 && baseUrl && <Button variant="outline" className="mt-4 w-full" onClick={discover}><RefreshCw data-icon="inline-start" /> Run lookup</Button>}
    </CardContent></Card>
  </div>;
}
