import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';

const PRIVATE_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

function isPrivateAddress(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (PRIVATE_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.internal')) return true;
  if (isIP(host) === 4) {
    const [a, b] = host.split('.').map(Number);
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 169 && b === 254;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = body?.provider === 'anthropic' ? 'anthropic' : body?.provider === 'openai' ? 'openai' : null;
    const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl.trim() : '';
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';

    if (!provider || !baseUrl) return NextResponse.json({ error: 'Choose a provider and enter a base URL.' }, { status: 400 });

    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
      return NextResponse.json({ error: 'Enter a complete URL, such as https://api.openai.com/v1.' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(url.protocol)) return NextResponse.json({ error: 'The URL must use HTTP or HTTPS.' }, { status: 400 });
    if (isPrivateAddress(url.hostname)) return NextResponse.json({ error: 'Private and local network addresses are not allowed from the hosted app.' }, { status: 400 });

    const path = url.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/models')) url.pathname = `${path.endsWith('/v1') ? path : `${path}/v1`}/models`;
    url.search = '';
    url.hash = '';

    const headers: Record<string, string> = { Accept: 'application/json' };
    const configuredKey = apiKey || (provider === 'openai' ? process.env.OPENAI_API_KEY ?? '' : '');
    if (provider === 'openai' && configuredKey) headers.Authorization = `Bearer ${configuredKey}`;
    if (provider === 'anthropic') {
      if (apiKey) headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    let response: Response;
    try {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000), cache: 'no-store' });
    } catch (error) {
      const message = error instanceof Error && error.name === 'TimeoutError'
        ? 'The endpoint took too long to respond.'
        : 'The endpoint could not be reached. Check the URL, DNS, TLS certificate, and whether it allows requests from a hosted server.';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const raw = await response.text();
    let payload: any = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { /* handled below */ }
    if (!response.ok) {
      const detail = payload?.error?.message || payload?.error?.type || payload?.message || raw.slice(0, 300) || `Endpoint returned ${response.status}.`;
      return NextResponse.json({ error: `${String(detail)} (HTTP ${response.status})` }, { status: response.status >= 400 && response.status < 500 ? response.status : 502 });
    }
    if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'The endpoint returned a successful response that was not valid JSON.' }, { status: 502 });

    const models = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.models) ? payload.models : [];
    return NextResponse.json({ models: models.map((model: any) => ({ id: String(model.id ?? model.name ?? ''), ownedBy: model.owned_by ?? model.ownedBy ?? null, created: model.created ?? null })).filter((model: { id: string }) => model.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to query that endpoint.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
