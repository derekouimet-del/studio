'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating plausible but FAKE breached passwords based on a topic.
 *
 * - generateBreachedPasswords - A function that takes a topic and generates sample passwords.
 * - GenerateBreachedPasswordsInput - The input type for the function.
 * - GenerateBreachedPasswordsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBreachedPasswordsInputSchema = z.object({
  topic: z.string().describe('A topic or theme to base password generation on (e.g., a company name, a hobby, a movie).'),
  count: z.number().describe('The number of password suggestions to generate.'),
});
export type GenerateBreachedPasswordsInput = z.infer<typeof GenerateBreachedPasswordsInputSchema>;

const GenerateBreachedPasswordsOutputSchema = z.object({
  passwords: z
    .array(z.string())
    .describe('A list of plausible, but fake, password suggestions related to the topic.'),
});
export type GenerateBreachedPasswordsOutput = z.infer<typeof GenerateBreachedPasswordsOutputSchema>;

export async function generateBreachedPasswords(input: GenerateBreachedPasswordsInput): Promise<GenerateBreachedPasswordsOutput> {
  return generateBreachedPasswordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBreachedPasswordsPrompt',
  input: {schema: GenerateBreachedPasswordsInputSchema},
  output: {schema: GenerateBreachedPasswordsOutputSchema},
  prompt: `You are a security researcher creating sample data. Based on the topic "{{topic}}", generate a list of {{{count}}} plausible but FAKE passwords that might appear in a data leak.

Incorporate common password patterns:
- Combine the topic with common years (e.g., topic2023, topic!@24).
- Use common substitutions (e.g., 'a' -> '@', 's' -> '$').
- Append common words or numbers (e.g., topic123, passwordtopic).
- Do not use real, known breached passwords. The goal is to generate realistic examples for testing purposes.

Topic: {{{topic}}}

Generate {{{count}}} password examples.`,
});

const generateBreachedPasswordsFlow = ai.defineFlow(
  {
    name: 'generateBreachedPasswordsFlow',
    inputSchema: GenerateBreachedPasswordsInputSchema,
    outputSchema: GenerateBreachedPasswordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
