'use server';

/**
 * @fileOverview A Genkit flow that analyzes text content for sensitive data.
 *
 * - dataSieve - A function that takes text content and extracts sensitive information.
 * - DataSieveInput - The input type for the function.
 * - DataSieveOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DataSieveInputSchema = z.object({
  content: z.string().describe('The text content to analyze.'),
});
export type DataSieveInput = z.infer<typeof DataSieveInputSchema>;

const FoundDataSchema = z.object({
    id: z.string(),
    type: z.string().describe('The type of data found (e.g., "Email", "Credit Card", "SSN", "API Key", "Password").'),
    value: z.string().describe('The sensitive data value itself.'),
    context: z.string().describe('A small snippet of the surrounding text for context.').optional(),
});

const DataSieveOutputSchema = z.object({
  foundData: z.array(FoundDataSchema).describe('A list of discovered sensitive data.'),
});
export type DataSieveOutput = z.infer<typeof DataSieveOutputSchema>;

export async function dataSieve(input: DataSieveInput): Promise<DataSieveOutput> {
  return dataSieveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dataSievePrompt',
  input: { schema: DataSieveInputSchema },
  output: { schema: DataSieveOutputSchema },
  prompt: `You are a security analysis tool named DataSieve. Your task is to meticulously scan the provided text content for any form of sensitive information.

Extract the following types of data:
- Email addresses
- Credit Card numbers
- Social Security Numbers (SSNs)
- API Keys (look for common prefixes like 'sk_', 'pk_', 'rk_' and high-entropy strings)
- Passwords (look for explicit labels like 'password:', 'pass:', 'secret=')
- Private Keys (look for "-----BEGIN RSA PRIVATE KEY-----" or similar markers)

For each piece of sensitive data you find, create a unique ID, identify its type, extract its value, and provide a small snippet of the surrounding text for context.

Do not find more than 50 items in total.

Return a JSON object with a 'foundData' array. If nothing is found, return an empty array.

Content to analyze:
---
{{{content}}}
---
`,
});


const dataSieveFlow = ai.defineFlow(
  {
    name: 'dataSieveFlow',
    inputSchema: DataSieveInputSchema,
    outputSchema: DataSieveOutputSchema,
  },
  async ({ content }) => {
    // For very large files, we might need to chunk the content.
    // For now, we'll send the whole thing, but this is a future optimization point.
    const MAX_LENGTH = 500000; // Limit content size to avoid hitting model limits
    const truncatedContent = content.length > MAX_LENGTH ? content.substring(0, MAX_LENGTH) : content;

    const { output } = await prompt({ content: truncatedContent });
    
    if (!output) {
      return { foundData: [] };
    }

    return output;
  }
);
