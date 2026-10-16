'use server';

/**
 * @fileOverview Oracle AI assistant flow.
 *
 * - oracle - A function that sends messages to the Oracle AI assistant.
 * - OracleInput - The input type for the function.
 * - OracleOutput - The return type for the function.
 */

import { generateText } from 'ai';
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
  const result = await generateText({
    model: 'openai/gpt-5.4',
    messages: input.messages,
    maxOutputTokens: 1024,
  });

  return {
    response: result.text,
  };
}
