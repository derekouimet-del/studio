'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating wordlist suggestions.
 *
 * - suggestWordlist - A function that takes a topic and generates relevant words.
 * - WordlistSuggestionInput - The input type for the suggestWordlist function.
 * - WordlistSuggestionOutput - The return type for the suggestWordlist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WordlistSuggestionInputSchema = z.object({
  topic: z.string().describe('A topic or theme to base wordlist suggestions on (e.g., a company name, a person\'s interests, a technology).'),
  count: z.number().describe('The number of suggestions to generate.'),
});
export type WordlistSuggestionInput = z.infer<typeof WordlistSuggestionInputSchema>;

const WordlistSuggestionOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of suggested words for the wordlist.'),
});
export type WordlistSuggestionOutput = z.infer<typeof WordlistSuggestionOutputSchema>;

export async function suggestWordlist(input: WordlistSuggestionInput): Promise<WordlistSuggestionOutput> {
  return wordlistSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'wordlistSuggestionPrompt',
  input: {schema: WordlistSuggestionInputSchema},
  output: {schema: WordlistSuggestionOutputSchema},
  prompt: `You are a penetration testing assistant specializing in creating custom wordlists for password cracking.
Given a topic, generate a list of {{{count}}} relevant keywords, names, and phrases.
Think about variations, common substitutions, and related terms.
For example, if the topic is "Firebase", suggestions could include "firestore", "google", "auth", "database", "fcm", "realtime".

Topic: {{{topic}}}

Generate a list of {{{count}}} words.`,
});

const wordlistSuggestionFlow = ai.defineFlow(
  {
    name: 'wordlistSuggestionFlow',
    inputSchema: WordlistSuggestionInputSchema,
    outputSchema: WordlistSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
