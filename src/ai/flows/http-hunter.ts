'use server';

/**
 * @fileOverview A flow that functions as a subdomain and HTTP title scanner.
 * - httpHunter - A function that takes a target domain, probes common subdomains, and returns their HTTP status and title.
 * - HttpHunterInput - The input type for the httpHunter function.
 * - HttpHunterOutput - The return type for the httpHunter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HttpHunterInputSchema = z.object({
  targetDomain: z.string().describe('The base domain to scan for subdomains.'),
});
export type HttpHunterInput = z.infer<typeof HttpHunterInputSchema>;

const HuntResultSchema = z.object({
  id: z.string(),
  url: z.string(),
  statusCode: z.number(),
  title: z.string().nullable(),
});

const HttpHunterOutputSchema = z.object({
  results: z.array(HuntResultSchema).describe('A list of discovered subdomains and their status.'),
});
export type HttpHunterOutput = z.infer<typeof HttpHunterOutputSchema>;

export async function httpHunter(input: HttpHunterInput): Promise<HttpHunterOutput> {
  return httpHunterFlow(input);
}

const httpHunterFlow = ai.defineFlow(
  {
    name: 'httpHunterFlow',
    inputSchema: HttpHunterInputSchema,
    outputSchema: HttpHunterOutputSchema,
  },
  async ({ targetDomain }) => {
    // A list of common subdomains to check, similar to many enumeration tools.
    const commonSubdomains = [
        "www", "mail", "ftp", "localhost", "webmail", "smtp", "pop", "ns1", "ns2",
        "api", "dev", "test", "staging", "beta", "shop", "blog", "my", "support", "docs", "portal",
        "admin", "cpanel", "webdisk", "autodiscover", "owa", "m", "vpn", "files", "cloud",
        "intranet", "demo", "secure", "assets", "static", "cdn", "sql", "mysql", "db",
        "git", "svn", "status", "uat", "prod", "old", "new", "internal", "external"
    ];

    const probe = async (url: string) => {
        try {
            // We don't want to follow redirects, as the initial status code is more informative.
            const response = await fetch(url, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'Pen-Quest-Hunter/1.0', 'Accept': '*/*' } });
            const contentType = response.headers.get('content-type') || '';
            let title: string | null = null;
            
            if (response.status >= 300 && response.status < 400) {
                title = `Redirect -> ${response.headers.get('Location') || ''}`;
            } else if (response.ok && contentType.includes('text/html')) {
                // Read only the first few KB to find the title, for performance.
                const text = await response.text();
                // Simple regex to find the title, similar to the user's Python script
                const titleMatch = text.match(/<title.*?>(.*?)<\/title>/is);
                title = titleMatch ? titleMatch[1].trim() : '(No Title Found)';
            } else if (response.ok) {
                title = `(${contentType})`;
            }

            return { url, statusCode: response.status, title };

        } catch (error) {
            // Network error, e.g., DNS resolution failed, TCP refused, etc.
            return null;
        }
    };
    
    const probePromises = commonSubdomains.flatMap(sub => [
        probe(`http://${sub}.${targetDomain}`),
        probe(`https://${sub}.${targetDomain}`)
    ]);

    const results = await Promise.all(probePromises);

    const successfulProbes = results
        .filter((r): r is { url: string; statusCode: number; title: string | null; } => r !== null) // Filter out nulls from failed probes
        .filter(r => r.statusCode > 0 && (r.statusCode < 400 || [401, 403].includes(r.statusCode))) // Only show interesting status codes
        .map((r, index) => ({ ...r, id: `${r.url}-${index}` }));
        
    return { results: successfulProbes };
  }
);
