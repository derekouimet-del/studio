'use server';

/**
 * @fileOverview A Genkit flow that searches for vulnerabilities for a given product.
 *
 * - vulndbExplorer - A function that takes a product and version and returns known CVEs.
 * - VulnDBExplorerInput - The input type for the function.
 * - VulnDBExplorerOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VulnDBExplorerInputSchema = z.object({
  product: z.string().describe('The product name to search for (e.g., Apache, OpenSSH).'),
  version: z.string().optional().describe('The specific version of the product.'),
});
export type VulnDBExplorerInput = z.infer<typeof VulnDBExplorerInputSchema>;

const VulnerabilitySchema = z.object({
    cveId: z.string().describe('The CVE identifier (e.g., CVE-2021-44228).'),
    description: z.string().describe('A brief description of the vulnerability.'),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Unknown']).describe('The severity level of the vulnerability.'),
    metasploitModules: z.array(z.string()).optional().describe('A list of relevant Metasploit module paths, if any (e.g., "exploit/windows/smb/ms17_010_eternalblue").'),
});

const VulnDBExplorerOutputSchema = z.object({
  vulnerabilities: z.array(VulnerabilitySchema).describe('A list of discovered vulnerabilities.'),
});
export type VulnDBExplorerOutput = z.infer<typeof VulnDBExplorerOutputSchema>;

export async function vulndbExplorer(input: VulnDBExplorerInput): Promise<VulnDBExplorerOutput> {
  return vulndbExplorerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vulndbExplorerPrompt',
  input: { schema: VulnDBExplorerInputSchema },
  output: { schema: VulnDBExplorerOutputSchema },
  prompt: `You are a cybersecurity vulnerability database. Given a software product and an optional version, search your knowledge base for known vulnerabilities (CVEs).

Product: {{{product}}}
{{#if version}}
Version: {{{version}}}
{{/if}}

For each vulnerability found, provide its CVE ID, a concise description, its severity (Critical, High, Medium, Low, or Unknown), and a list of any relevant Metasploit modules that can be used to exploit it. If no modules exist for a CVE, you can omit the field. Prioritize more recent and critical vulnerabilities if there are many.

Return a JSON object with a 'vulnerabilities' array. If no vulnerabilities are found, return an empty array.`,
});

const vulndbExplorerFlow = ai.defineFlow(
  {
    name: 'vulndbExplorerFlow',
    inputSchema: VulnDBExplorerInputSchema,
    outputSchema: VulnDBExplorerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
