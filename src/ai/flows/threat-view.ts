'use server';

/**
 * @fileOverview A Genkit flow that simulates a Shodan-like search for exposed services.
 *
 * - threatView - A function that takes a query and returns a list of simulated hosts.
 * - ThreatViewInput - The input type for the function.
 * - ThreatViewOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ThreatViewInputSchema = z.object({
  query: z.string().describe('The search query, which can be a service name, port number, or product.'),
});
export type ThreatViewInput = z.infer<typeof ThreatViewInputSchema>;

const HostResultSchema = z.object({
    ipAddress: z.string().describe('A plausible but fake IP address for the host.'),
    location: z.string().describe('A plausible city and country for the host (e.g., "Seoul, South Korea").'),
    banner: z.string().describe('A realistic service banner, including version numbers and server details.'),
    notes: z.string().describe('A brief note on potential vulnerabilities or misconfigurations based on the banner.'),
});

const ThreatViewOutputSchema = z.object({
  results: z.array(HostResultSchema).describe('A list of simulated host results matching the query.'),
});
export type ThreatViewOutput = z.infer<typeof ThreatViewOutputSchema>;

export async function threatView(input: ThreatViewInput): Promise<ThreatViewOutput> {
  return threatViewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'threatViewPrompt',
  input: { schema: ThreatViewInputSchema },
  output: { schema: ThreatViewOutputSchema },
  prompt: `You are an AI simulating a Shodan-like internet intelligence database. Your task is to generate a list of 5 realistic but **fictional** examples of exposed hosts based on a user's query.

Query: "{{{query}}}"

For each example, you must invent:
1.  A plausible but **non-real** public IP address.
2.  A plausible location (City, Country).
3.  A detailed and realistic service banner that would be returned by the service. This should include version numbers, server software, and other identifying information.
4.  A brief "notes" field explaining a potential vulnerability or interesting point about the banner (e.g., "Outdated version, vulnerable to...", "Default configuration detected.").

The results should look like real-world data found on exposed services. For example, if the query is "MongoDB", you might return an example with a banner showing an unprotected database instance. If the query is "port:21", you'd show various FTP server banners.

Generate exactly 5 results.`,
});

const threatViewFlow = ai.defineFlow(
  {
    name: 'threatViewFlow',
    inputSchema: ThreatViewInputSchema,
    outputSchema: ThreatViewOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
