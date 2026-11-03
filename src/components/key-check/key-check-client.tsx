'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldCheck, WalletCards } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Provider = 'openrouter' | 'openai' | 'anthropic' | 'google';
type Result = { valid: boolean; provider?: string; models?: number | null; credits?: { used?: number; limit?: number; remaining?: number; currency?: string } | null; creditsAvailable?: boolean; note?: string; error?: string };

const providers: { id: Provider; label: string; hint: string }[] = [
  { id: 'openrouter', label: 'OpenRouter', hint: 'Models + credits' },
  { id: 'openai', label: 'OpenAI', hint: 'Models endpoint' },
  { id: 'anthropic', label: 'Claude', hint: 'Models endpoint' },
  { id: 'google', label: 'Google AI', hint: 'Models endpoint' },
];

const money = (value?: number) => value === undefined ? '—' : `$${value.toFixed(2)}`;

export function KeyCheckClient() {
  const [provider, setProvider] = useState<Provider>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function checkKey(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/key-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, apiKey }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to check this key.');
      setResult(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to check this key.');
    } finally { setLoading(false); }
  }

  return <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
    <Card className="h-fit"><CardHeader><div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><KeyRound /></div><CardTitle>Verify an API key</CardTitle><CardDescription>Make one authenticated, read-only request to the provider. The key is sent over HTTPS and never stored.</CardDescription></CardHeader><CardContent><form onSubmit={checkKey} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2"><Label>Provider</Label><Tabs value={provider} onValueChange={(value) => { setProvider(value as Provider); setResult(null); setError(''); }}><TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">{providers.map((item) => <TabsTrigger key={item.id} value={item.id} className="h-auto min-h-12 flex-col gap-0.5 px-2 py-2 text-xs"><span>{item.label}</span><span className="font-normal text-muted-foreground">{item.hint}</span></TabsTrigger>)}</TabsList></Tabs></div>
      <div className="flex flex-col gap-2"><Label htmlFor="api-key">API key</Label><div className="relative"><KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="pl-9 font-mono" placeholder="Paste your key" autoComplete="off" required /></div><p className="text-xs text-muted-foreground">Only use a key you own or are authorized to test. Never paste it into a public issue or chat.</p></div>
      <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}{loading ? 'Checking key…' : 'Check key securely'}</Button>
    </form></CardContent></Card>
    <Card className="min-h-[420px]"><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Verification result</CardTitle><CardDescription>Provider responses are summarized without revealing your key.</CardDescription></div>{result?.valid ? <Badge variant="secondary"><CheckCircle2 className="mr-1 size-3" /> Valid</Badge> : result && <Badge variant="destructive"><AlertCircle className="mr-1 size-3" /> Rejected</Badge>}</CardHeader><CardContent>
      {error && <Alert variant="destructive" className="mb-5"><AlertCircle /><AlertTitle>Check failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {loading && <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-muted-foreground"><Loader2 className="size-8 animate-spin text-primary" /><p>Making a read-only request to {providers.find((item) => item.id === provider)?.label}…</p></div>}
      {!loading && result?.error && <Alert variant="destructive"><AlertCircle /><AlertTitle>Key was not accepted</AlertTitle><AlertDescription>{result.error}</AlertDescription></Alert>}
      {!loading && result?.valid && <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg border bg-background/40 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Provider</p><p className="mt-2 font-medium">{result.provider}</p><p className="mt-1 text-xs text-muted-foreground">Authentication succeeded.</p></div><div className="rounded-lg border bg-background/40 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Models visible</p><p className="mt-2 text-2xl font-semibold">{result.models ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">Returned by the provider.</p></div><div className="rounded-lg border bg-background/40 p-4 sm:col-span-2"><div className="flex items-center gap-2"><WalletCards className="size-4 text-primary" /><p className="text-xs uppercase tracking-wider text-muted-foreground">Credits / balance</p></div>{result.creditsAvailable ? <div className="mt-4 grid grid-cols-3 gap-3"><div><p className="text-xs text-muted-foreground">Remaining</p><p className="mt-1 font-semibold">{money(result.credits?.remaining)}</p></div><div><p className="text-xs text-muted-foreground">Used</p><p className="mt-1 font-semibold">{money(result.credits?.used)}</p></div><div><p className="text-xs text-muted-foreground">Limit</p><p className="mt-1 font-semibold">{money(result.credits?.limit)}</p></div></div> : <p className="mt-3 text-sm text-muted-foreground">{result.note}</p>}</div></div>}
      {!loading && !result && !error && <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center text-muted-foreground"><ShieldCheck className="size-10 opacity-40" /><p className="max-w-sm text-sm">Choose a provider and run a check to see whether the key is accepted and whether balance data is available.</p></div>}
    </CardContent></Card>
  </div>;
}
