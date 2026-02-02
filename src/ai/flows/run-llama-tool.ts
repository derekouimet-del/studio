'use server';

/**
 * @fileOverview A Genkit flow to proxy requests to a self-hosted Llama instance.
 *
 * - runLlamaTool - A function that proxies a tool execution request to a Llama endpoint.
 * - LlamaToolInput - The input type for the runLlamaTool function.
 * - LlamaToolOutput - The return type for the runLlamaTool function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LlamaToolInputSchema = z.object({
  toolName: z.string().describe('The name of the tool to run on the Llama instance.'),
  payload: z.any().describe('The payload to send to the tool.'),
});
export type LlamaToolInput = z.infer<typeof LlamaToolInputSchema>;

const LlamaToolOutputSchema = z.object({
  ok: z.boolean(),
  result: z.any().optional(),
  warnings: z.array(z.string()).optional(),
  error: z.string().optional(),
});
export type LlamaToolOutput = z.infer<typeof LlamaToolOutputSchema>;

export async function runLlamaTool(input: LlamaToolInput): Promise<LlamaToolOutput> {
  return runLlamaToolFlow(input);
}

const runLlamaToolFlow = ai.defineFlow(
  {
    name: 'runLlamaToolFlow',
    inputSchema: LlamaToolInputSchema,
    outputSchema: LlamaToolOutputSchema,
  },
  async ({ toolName, payload }) => {
    // TODO: Add Firebase Auth verification here.
    // This requires getting the user's ID token on the client, passing it to this flow,
    // and using the Firebase Admin SDK to verify it.
    // A full implementation would require a bigger change to pass the auth token from the client.
    // For example:
    // if (!context.auth) {
    //   return { ok: false, error: 'The function must be called while authenticated.' };
    // }

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

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('Request to Llama endpoint timed out.');
            return { ok: false, error: 'Request to Llama service timed out.' };
        }
        console.error('Failed to make request to Llama endpoint:', error);
        return { ok: false, error: 'Failed to connect to Llama service.' };
    }
  }
);
