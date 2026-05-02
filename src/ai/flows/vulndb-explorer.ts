'use server';

/**
 * @fileOverview A flow that searches for vulnerabilities for a given product.
 *
 * - vulndbExplorer - A function that takes a product and version and returns known CVEs.
 * - VulnDBExplorerInput - The input type for the function.
 * - VulnDBExplorerOutput - The return type for the function.
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';

const VulnDBExplorerInputSchema = z.object({
  product: z.string().describe('The product name to search for (e.g., Apache, OpenSSH).'),
  version: z.string().optional().describe('The specific version of the product.'),
});
export type VulnDBExplorerInput = z.infer<typeof VulnDBExplorerInputSchema>;

const VulnerabilitySchema = z.object({
  cveId: z.string().describe('The CVE identifier (e.g., CVE-2021-44228).'),
  description: z.string().describe('A brief description of the vulnerability.'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Unknown']).describe('The severity level of the vulnerability.'),
  metasploitModules: z.array(z.string()).nullable().describe('A list of relevant Metasploit module paths, if any (e.g., "exploit/windows/smb/ms17_010_eternalblue").'),
});

const VulnDBExplorerOutputSchema = z.object({
  vulnerabilities: z.array(VulnerabilitySchema).describe('A list of discovered vulnerabilities.'),
});
export type VulnDBExplorerOutput = z.infer<typeof VulnDBExplorerOutputSchema>;

export async function vulndbExplorer(input: VulnDBExplorerInput): Promise<VulnDBExplorerOutput> {
  const versionClause = input.version ? `\nVersion: ${input.version}` : '';
  
  const { output } = await generateText({
    model: 'openai/gpt-4o',
    output: Output.object({
      schema: VulnDBExplorerOutputSchema,
    }),
    prompt: `You are a cybersecurity vulnerability database. Given a software product and an optional version, search your knowledge base for known vulnerabilities (CVEs).

Product: ${input.product}${versionClause}

For each vulnerability found, provide its CVE ID, a concise description, its severity (Critical, High, Medium, Low, or Unknown), and a list of any relevant Metasploit modules that can be used to exploit it. If no modules exist for a CVE, set metasploitModules to null. Prioritize more recent and critical vulnerabilities if there are many.

Return a JSON object with a 'vulnerabilities' array. If no vulnerabilities are found, return an empty array.`,
  });

  // Transform null metasploitModules to undefined for backward compatibility
  const result: VulnDBExplorerOutput = {
    vulnerabilities: (output?.vulnerabilities || []).map(v => ({
      ...v,
      metasploitModules: v.metasploitModules || undefined,
    })),
  };

  return result;
}
