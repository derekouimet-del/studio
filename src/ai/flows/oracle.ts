'use server';

/**
 * @fileOverview Oracle AI assistant flow using Hugging Face's Meta-Llama model.
 *
 * - oracle - A function that sends messages to the Oracle AI assistant.
 * - OracleInput - The input type for the function.
 * - OracleOutput - The return type for the function.
 */

import { z } from 'zod';

const OracleInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })).describe('The conversation history including the new user message.'),
});
export type OracleInput = z.infer<typeof OracleInputSchema>;

const OracleOutputSchema = z.object({
  response: z.string().describe('The assistant response.'),
});
export type OracleOutput = z.infer<typeof OracleOutputSchema>;

export async function oracle(input: OracleInput): Promise<OracleOutput> {
  const HF_TOKEN = process.env.HF_TOKEN;
  
  if (!HF_TOKEN) {
    throw new Error('HF_TOKEN environment variable is not set.');
  }

  const response = await fetch('https://router.huggingface.co/novita/v3/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct',
      messages: input.messages,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices?.[0]?.message?.content || '';

  return {
    response: assistantMessage,
  };
}
