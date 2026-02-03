'use server';

/**
 * @fileOverview A Genkit flow that suggests default credentials for a given product.
 *
 * - defaultPass - A function that takes a product name and returns common default credentials.
 * - DefaultPassInput - The input type for the function.
 * - DefaultPassOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DefaultPassInputSchema = z.object({
  product: z.string().describe('The product, vendor, or device name to search for (e.g., Cisco, Linksys Router, Hikvision Camera).'),
});
export type DefaultPassInput = z.infer<typeof DefaultPassInputSchema>;

const CredentialSchema = z.object({
    username: z.string().describe('The default username.'),
    password: z.string().describe('The default password.'),
    notes: z.string().optional().describe('Any additional notes, such as login instructions or if it needs to be changed on first use.'),
});

const DefaultPassOutputSchema = z.object({
  credentials: z.array(CredentialSchema).describe('A list of common default credentials.'),
});
export type DefaultPassOutput = z.infer<typeof DefaultPassOutputSchema>;

export async function defaultPass(input: DefaultPassInput): Promise<DefaultPassOutput> {
  return defaultPassFlow(input);
}

const prompt = ai.definePrompt({
  name: 'defaultPassPrompt',
  input: { schema: DefaultPassInputSchema },
  output: { schema: DefaultPassOutputSchema },
  prompt: `You are a database of default credentials for various devices and software. Given a product name, provide a list of the most common default username and password combinations.

Product: {{{product}}}

Search your knowledge base for default login credentials. Include any relevant notes if available.

Return a JSON object with a 'credentials' array. If no credentials are found, return an empty array.`,
});

const defaultPassFlow = ai.defineFlow(
  {
    name: 'defaultPassFlow',
    inputSchema: DefaultPassInputSchema,
    outputSchema: DefaultPassOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
