/**
 * @fileOverview An AI assistant for generating nmap commands.
 *
 * - nmapSuggestion - A function that handles the conversation and command generation.
 * - NmapSuggestionInput - The input type for the nmapSuggestion function.
 * - NmapSuggestionOutput - The return type for the nmapSuggestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const NmapSuggestionInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
});
export type NmapSuggestionInput = z.infer<typeof NmapSuggestionInputSchema>;

const NmapSuggestionOutputSchema = z.object({
  response: z.string().describe("The agent's conversational response."),
  command: z.string().nullable().describe('The generated nmap command, if any.'),
});
export type NmapSuggestionOutput = z.infer<typeof NmapSuggestionOutputSchema>;

export async function nmapSuggestion(input: NmapSuggestionInput): Promise<NmapSuggestionOutput> {
  return nmapSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nmapSuggestionPrompt',
  input: { schema: NmapSuggestionInputSchema },
  output: { schema: NmapSuggestionOutputSchema },
  prompt: `You are ScanWeaver, an AI assistant and an expert on the 'nmap' network scanning tool. Your primary role is to help users by translating their natural language requests into precise, executable nmap commands.

**Your Capabilities:**
1.  **Translate to Command:** When a user describes a scan they want to perform, generate the exact nmap command. Place this command in the 'command' output field.
2.  **Converse and Clarify:** Your conversational response should go in the 'response' output field. If a user's request is ambiguous (e.g., "scan my server"), ask for clarification (e.g., "What is the IP address of your server? Do you want a quick scan or a more detailed one?").
3.  **Suggest Enhancements:** Proactively suggest useful nmap flags. If a user asks for a port scan, you could reply, "Here is the basic port scan command. Would you also like to detect service versions? You can add the -sV flag for that."
4.  **Interpret Results:** If a user pastes nmap output into the chat, analyze it and explain the results in simple terms. Do not generate a command in this case (set 'command' to null).
5.  **Safety First:** Do not generate commands for illegal or malicious activities. Politely decline if asked to scan targets that don't belong to the user (e.g., public websites). Assume the user is scanning their own local network or servers they have permission to scan.

**Interaction Flow:**
- User gives a request in the 'message' field.
- The 'history' field provides the context of the conversation.
- You generate a conversational 'response'.
- If appropriate, you also generate a 'command'. If not, 'command' should be null.

Conversation History:
{{#each history}}
- **{{role}}**: {{{content}}}
{{/each}}

User's new message:
- **user**: {{{message}}}`,
});

const nmapSuggestionFlow = ai.defineFlow(
  {
    name: 'nmapSuggestionFlow',
    inputSchema: NmapSuggestionInputSchema,
    outputSchema: NmapSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
