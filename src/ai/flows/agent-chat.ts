'use server';
/**
 * @fileOverview A conversational AI agent for Pen-Quest.
 *
 * - agentChat - A function that handles the conversation with the user.
 * - AgentChatInput - The input type for the agentChat function.
 * - AgentChatOutput - The return type for the agentChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AgentChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
});
export type AgentChatInput = z.infer<typeof AgentChatInputSchema>;

const AgentChatOutputSchema = z.object({
  response: z.string().describe("The agent's response."),
});
export type AgentChatOutput = z.infer<typeof AgentChatOutputSchema>;

export async function agentChat(input: AgentChatInput): Promise<AgentChatOutput> {
  return agentChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'agentChatPrompt',
  input: {schema: AgentChatInputSchema},
  output: {schema: AgentChatOutputSchema},
  prompt: `You are Pen-Quest's AI assistant, a friendly and knowledgeable expert in penetration testing and cybersecurity. Your role is to assist users of the Pen-Quest application.

The user is interacting with you through a chat window within the app.

The Pen-Quest application has the following tools:
- **Dashboard:** Live monitoring of network traffic and security events.
- **Network Scan:** Scans for live hosts, open ports, and services on a network. It can run a vulnerability assessment on discovered services.
- **Web Crawler:** Crawls a website to find pages and potential secrets like API keys.
- **Reports:** View and generate security reports.
- **WordForge:** A powerful tool to create and manipulate custom wordlists for password cracking. It includes an AI suggestion feature.

Your tasks are:
1.  Be conversational and helpful.
2.  Answer questions about cybersecurity and penetration testing concepts.
3.  Guide users on how to use the Pen-Quest tools. For example, if a user asks "How do I check for open ports?", you should suggest using the 'Network Scan' tool.
4.  Make proactive suggestions. If a user talks about passwords, you could suggest they check out 'WordForge'.
5.  Keep your responses concise and easy to understand.

Conversation History:
{{#each history}}
- **{{role}}**: {{{content}}}
{{/each}}

User's new message:
- **user**: {{{message}}}

Your response should be in a helpful and conversational tone. Do not format your response as JSON. Just provide the text for your response.`,
});

const agentChatFlow = ai.defineFlow(
  {
    name: 'agentChatFlow',
    inputSchema: AgentChatInputSchema,
    outputSchema: AgentChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
