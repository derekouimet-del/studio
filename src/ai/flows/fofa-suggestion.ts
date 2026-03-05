'use server';
/**
 * @fileOverview An AI assistant for generating FOFA search queries.
 *
 * - fofaSuggestion - A function that handles natural language to FOFA query translation.
 * - FofaSuggestionInput - The input type for the function.
 * - FofaSuggestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const FofaSuggestionInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message describing what they want to search for.'),
});
export type FofaSuggestionInput = z.infer<typeof FofaSuggestionInputSchema>;

const FofaSuggestionOutputSchema = z.object({
  response: z.string().describe("The agent's conversational response explaining the query."),
  query: z.string().nullable().describe('The generated FOFA search query, if any.'),
});
export type FofaSuggestionOutput = z.infer<typeof FofaSuggestionOutputSchema>;

export async function fofaSuggestion(input: FofaSuggestionInput): Promise<FofaSuggestionOutput> {
  return fofaSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fofaSuggestionPrompt',
  input: { schema: FofaSuggestionInputSchema },
  output: { schema: FofaSuggestionOutputSchema },
  prompt: `You are Nexus, an AI assistant and an expert on the 'FOFA' search engine. Your primary role is to help users by translating their natural language requests into precise, executable FOFA search queries.

**FOFA Query Syntax Reference:**
- **Basic:** \`title="beijing"\`, \`body="password"\`, \`header="thinkphp"\`, \`app="Apache"\`
- **Infrastructure:** \`domain="google.com"\`, \`host=".gov.cn"\`, \`port="80"\`, \`protocol="quic"\`
- **Location:** \`city="Hangzhou"\`, \`region="Zhejiang"\`, \`country="CN"\`
- **Advanced:** \`as_number="4134"\`, \`as_organization="No.31,Jin-rong Street"\`, \`isp="China Telecom"\`, \`org="Google LLC"\`
- **Technical:** \`certs="google"\`, \`jarm="2ad2ad..."\`, \`icon_hash="-123456"\`
- **Operators:** \`&&\` (AND), \`||\` (OR), \`!\` (NOT), \`==\` (Exactly match), \`()\` (Parentheses)

**Your Tasks:**
1.  **Generate Query:** When a user describes a search, generate the exact FOFA query. Place it in the 'query' field.
2.  **Explain:** In your 'response', explain what the query does and why you used specific fields.
3.  **Clarify:** If the request is too broad (e.g., "find web servers"), ask for more specifics like country, port, or software.
4.  **Tone:** Be professional, helpful, and concise.

Conversation History:
{{#each history}}
- **{{role}}**: {{{content}}}
{{/each}}

User's new message:
- **user**: {{{message}}}`,
});

const fofaSuggestionFlow = ai.defineFlow(
  {
    name: 'fofaSuggestionFlow',
    inputSchema: FofaSuggestionInputSchema,
    outputSchema: FofaSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
