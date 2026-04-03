/**
 * @fileOverview A flow to proxy requests to a self-hosted Llama instance.
 */

// Types defined inline to avoid exporting objects from 'use server' file
export type LlamaToolInput = {
  toolName: string;
  payload: unknown;
};

export type LlamaToolOutput = {
  ok: boolean;
  result?: unknown;
  warnings?: string[];
  error?: string;
};

export async function runLlamaTool(input: LlamaToolInput): Promise<LlamaToolOutput> {
  const { toolName, payload } = input;

  const baseUrl = process.env.LLAMA_BASE_URL;
  const apiKey = process.env.LLAMA_API_KEY;

  if (!baseUrl || !apiKey) {
    console.error('LLAMA_BASE_URL or LLAMA_API_KEY is not set in environment variables.');
    return { ok: false, error: 'Server configuration error: Llama endpoint credentials are not set.' };
  }

  const targetUrl = `${baseUrl}/tools/${toolName}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Llama endpoint returned an error: ${response.status} ${errorText}`);
      return { ok: false, error: `Request to Llama service failed with status: ${response.status}` };
    }

    const result = await response.json();
    
    return {
      ok: result.ok ?? true,
      result: result.result ?? result,
      warnings: result.warnings ?? [],
    };

  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request to Llama endpoint timed out.');
      return { ok: false, error: 'Request to Llama service timed out.' };
    }
    console.error('Failed to make request to Llama endpoint:', error);
    return { ok: false, error: 'Failed to connect to Llama service.' };
  }
}
