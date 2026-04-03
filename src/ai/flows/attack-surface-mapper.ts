/**
 * @fileOverview A Genkit flow that discovers subdomains for a given domain.
 *
 * - mapAttackSurface - A function that takes a domain and returns its live subdomains and IPs.
 * - AttackSurfaceMapperInput - The input type for the function.
 * - AttackSurfaceMapperOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AttackSurfaceMapperInputSchema = z.object({
  domain: z.string().describe('The domain to map.'),
});
export type AttackSurfaceMapperInput = z.infer<typeof AttackSurfaceMapperInputSchema>;

const AttackSurfaceResultSchema = z.object({
  subdomain: z.string(),
  ip: z.string(),
});

const AttackSurfaceMapperOutputSchema = z.object({
  results: z.array(AttackSurfaceResultSchema).describe('A list of discovered subdomains and their IPs.'),
});
export type AttackSurfaceMapperOutput = z.infer<typeof AttackSurfaceMapperOutputSchema>;

export async function mapAttackSurface(input: AttackSurfaceMapperInput): Promise<AttackSurfaceMapperOutput> {
  return attackSurfaceMapperFlow(input);
}

// A list of common subdomains to check. This is not exhaustive.
const commonSubdomains = [
  'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'ns2', 'ns3', 'ns4',
  'api', 'dev', 'staging', 'test', 'admin', 'dashboard', 'blog', 'shop', 'm', 'portal',
  'vpn', 'remote', 'internal', 'secure', 'cpanel', 'autodiscover', 'owa', 'support',
  'docs', 'git', 'svn', 'db', 'sql', 'mysql', 'mongo', 'redis'
];

async function resolveDns(domain: string): Promise<{ subdomain: string; ip: string } | null> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.Answer && data.Answer.length > 0) {
      const ip = data.Answer.find((ans: any) => ans.type === 1)?.data; // Type 1 is 'A' record
      if (ip) {
        return { subdomain: domain, ip };
      }
    }
    return null;
  } catch (error) {
    console.error(`DNS lookup failed for ${domain}:`, error);
    return null;
  }
}

const attackSurfaceMapperFlow = ai.defineFlow(
  {
    name: 'attackSurfaceMapperFlow',
    inputSchema: AttackSurfaceMapperInputSchema,
    outputSchema: AttackSurfaceMapperOutputSchema,
  },
  async ({ domain }) => {
    const domainsToScan = [domain, ...commonSubdomains.map(sub => `${sub}.${domain}`)];
    
    const promises = domainsToScan.map(resolveDns);
    
    const results = await Promise.all(promises);
    
    const validResults = results.filter((r): r is { subdomain: string; ip: string } => r !== null);
    
    return { results: validResults };
  }
);
