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

    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('The URL must use HTTP or HTTPS.');
    if (isPrivateAddress(url.hostname)) throw new Error('Private and local network addresses are not allowed.');

    const path = url.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/models')) url.pathname = `${path.endsWith('/v1') ? path : `${path}/v1`}/models`;
    url.search = '';

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (provider === 'openai' && apiKey) headers.Authorization = `Bearer ${apiKey}`;
    if (provider === 'anthropic') {
      if (apiKey) headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }

    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000), cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload?.error?.message || payload?.error || `Endpoint returned ${response.status}.`;
      return NextResponse.json({ error: String(detail) }, { status: response.status >= 400 && response.status < 500 ? response.status : 502 });
    }

    const models = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
    return NextResponse.json({ models: models.map((model: any) => ({ id: String(model.id ?? model.name ?? ''), ownedBy: model.owned_by ?? model.ownedBy ?? null, created: model.created ?? null })).filter((model: { id: string }) => model.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach that endpoint.';
    return NextResponse.json({ error: message.includes('Invalid URL') ? 'Enter a complete base URL, such as https://api.openai.com/v1.' : message }, { status: 400 });
  }
}
