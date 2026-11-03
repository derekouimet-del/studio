import { NextRequest, NextResponse } from 'next/server';

type Provider = 'openrouter' | 'openai' | 'anthropic' | 'google';

const PROVIDERS: Record<Provider, { label: string; modelsUrl: string; creditsUrl?: string }> = {
  openrouter: { label: 'OpenRouter', modelsUrl: 'https://openrouter.ai/api/v1/models', creditsUrl: 'https://openrouter.ai/api/v1/credits' },
  openai: { label: 'OpenAI', modelsUrl: 'https://api.openai.com/v1/models' },
  anthropic: { label: 'Claude', modelsUrl: 'https://api.anthropic.com/v1/models' },
  google: { label: 'Google AI', modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models' },
};

function errorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const value = payload as { error?: { message?: string } | string; message?: string };
  if (typeof value.error === 'string') return value.error;
  if (value.error?.message) return value.error.message;
  return value.message || fallback;
}

async function requestJson(url: string, headers: HeadersInit) {
  const response = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(12_000) });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { /* provider returned non-JSON */ }
  return { response, payload };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = body?.provider as Provider;
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
    const config = PROVIDERS[provider];

    if (!config || !apiKey) return NextResponse.json({ error: 'Choose a provider and enter an API key.' }, { status: 400 });
    if (apiKey.length > 512) return NextResponse.json({ error: 'That key is too long to check.' }, { status: 400 });

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'google') {
      headers['x-goog-api-key'] = apiKey;
    } else {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const modelResult = await requestJson(config.modelsUrl, headers);
    if (!modelResult.response.ok) {
      return NextResponse.json({ valid: false, provider: config.label, error: errorMessage(modelResult.payload, `Provider returned HTTP ${modelResult.response.status}.`) }, { status: 200 });
    }

    const models = modelResult.payload && typeof modelResult.payload === 'object' && 'data' in modelResult.payload && Array.isArray(modelResult.payload.data)
      ? modelResult.payload.data.length
      : modelResult.payload && typeof modelResult.payload === 'object' && 'models' in modelResult.payload && Array.isArray(modelResult.payload.models)
        ? modelResult.payload.models.length
        : null;

    let credits: { used?: number; limit?: number; remaining?: number; currency?: string } | null = null;
    let creditsAvailable = false;
    if (config.creditsUrl) {
      const creditResult = await requestJson(config.creditsUrl, headers);
      if (creditResult.response.ok && creditResult.payload && typeof creditResult.payload === 'object' && 'data' in creditResult.payload) {
        const data = creditResult.payload.data as { total_credits?: number; total_usage?: number };
        const limit = typeof data.total_credits === 'number' ? data.total_credits : undefined;
        const used = typeof data.total_usage === 'number' ? data.total_usage : undefined;
        credits = { limit, used, remaining: limit !== undefined && used !== undefined ? Math.max(0, limit - used) : undefined, currency: 'USD' };
        creditsAvailable = true;
      }
    }

    return NextResponse.json({ valid: true, provider: config.label, models, credits, creditsAvailable, note: creditsAvailable ? undefined : 'This provider does not expose a balance endpoint for this key.' });
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError' ? 'The provider timed out. Try again.' : 'Could not reach the provider.';
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
