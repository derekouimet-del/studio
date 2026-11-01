import { Client } from '@gradio/client';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

const SPACES = {
  anyImage: 'derekextra33/Any_Image',
  qwenImage: 'a-test-user-in-the-wrold/qwen-image-21-uncensored',
} as const;

function findPromptIndex(parameters: Array<{ label?: string; parameter_name?: string }>) {
  return parameters.findIndex((parameter) =>
    /prompt|description|text|caption/i.test(`${parameter.label ?? ''} ${parameter.parameter_name ?? ''}`),
  );
}

function serializeOutput(value: unknown): unknown {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'url' in value) return (value as { url: string }).url;
  if (Array.isArray(value)) return value.map(serializeOutput);
  return value;
}

export async function POST(request: Request) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'HF_TOKEN is not configured for this project.' }, { status: 500 });
  }

  try {
    const { prompt, space = 'anyImage' } = (await request.json()) as { prompt?: string; space?: keyof typeof SPACES };
    const selectedSpace = space in SPACES ? space : 'anyImage';
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });
    }

    const client = await Client.connect(SPACES[selectedSpace], { token: token as `hf_${string}` });
    const api = await client.view_api();
    const namedEndpoints = Object.entries(api.named_endpoints ?? {});
    const endpoint = namedEndpoints.find(([, definition]) => findPromptIndex(definition.parameters ?? []) >= 0) ?? namedEndpoints[0];

    if (!endpoint) {
      return NextResponse.json({ error: 'Any_Image did not expose a callable Gradio endpoint.' }, { status: 502 });
    }

    const [apiName, definition] = endpoint;
    const parameters = definition.parameters ?? [];
    const promptIndex = Math.max(0, findPromptIndex(parameters));
    const inputs = parameters.map((parameter, index) => {
      if (index === promptIndex) return prompt.trim();
      if ('parameter_default' in parameter && parameter.parameter_default !== undefined) return parameter.parameter_default;
      const rawType = (parameter as { type?: unknown }).type;
      const type = typeof rawType === 'string' ? rawType : rawType && typeof rawType === 'object' && 'type' in rawType ? (rawType as { type?: string }).type : undefined;
      if (type === 'boolean') return false;
      if (type === 'number' || type === 'integer') return 0;
      return '';
    });

    const result = await client.predict<unknown[]>(apiName, inputs);
    const output = result.data.map((item: unknown) => serializeOutput(item)).find((item: unknown) => typeof item === 'string' || (item && typeof item === 'object'));

    if (!output) {
      return NextResponse.json({ error: 'Any_Image returned no image output.' }, { status: 502 });
    }

    return NextResponse.json({ image: output, endpoint: apiName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Any_Image request failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
