'use server';

/**
 * @fileOverview A Genkit flow that simulates a web crawler and security scanner.
 *
 * - crawlWebsite - A function that takes a target URL and simulates crawling for pages and secrets.
 * - CrawlWebsiteInput - The input type for the crawlWebsite function.
 * - CrawlWebsiteOutput - The return type for the crawlWebsite function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PageResultSchema = z.object({
  id: z.string(),
  url: z.string().describe('The crawled URL path.'),
  statusCode: z.number().describe('The HTTP status code of the page.'),
  title: z.string().describe('The title of the page.'),
});

const CredentialResultSchema = z.object({
    id: z.string(),
    source: z.string().describe('The source file or location where the credential was found.'),
    type: z.string().describe('The type of credential (e.g., API Key, Password).'),
    value: z.string().describe('The discovered credential value.'),
});

const CrawlWebsiteInputSchema = z.object({
  targetUrl: z.string().describe('The base URL to crawl.'),
});
export type CrawlWebsiteInput = z.infer<typeof CrawlWebsiteInputSchema>;

const CrawlWebsiteOutputSchema = z.object({
  pages: z.array(PageResultSchema).describe('A list of discovered pages.'),
  credentials: z.array(CredentialResultSchema).describe('A list of discovered credentials or secrets.'),
});
export type CrawlWebsiteOutput = z.infer<typeof CrawlWebsiteOutputSchema>;

export async function crawlWebsite(input: CrawlWebsiteInput): Promise<CrawlWebsiteOutput> {
  return crawlWebsiteFlow(input);
}

const crawlWebsitePrompt = ai.definePrompt({
  name: 'crawlWebsitePrompt',
  input: {schema: CrawlWebsiteInputSchema},
  output: {schema: CrawlWebsiteOutputSchema},
  prompt: `You are a web crawler and security scanner. Your task is to simulate crawling a website and identifying interesting pages and potential credential leaks.

Given the target URL: {{{targetUrl}}}

Generate a realistic list of 5-10 discovered pages, including common paths like '/login', '/admin', '/robots.txt', and some plausible but not necessarily real sub-pages. Assign realistic HTTP status codes (200, 302, 403, 404).

Also, generate a list of 1-3 plausible-looking but fake credentials or secrets that might be found in files like '.git/config', '.env', or in HTML comments. The credentials should look realistic but not be real, working credentials.

For each page, provide a unique 'id' as a string. For each credential, also provide a unique 'id' string.

Return the result as a JSON object with 'pages' and 'credentials' arrays.`,
});


const crawlWebsiteFlow = ai.defineFlow(
  {
    name: 'crawlWebsiteFlow',
    inputSchema: CrawlWebsiteInputSchema,
    outputSchema: CrawlWebsiteOutputSchema,
  },
  async input => {
    const {output} = await crawlWebsitePrompt(input);
    return output!;
  }
);
