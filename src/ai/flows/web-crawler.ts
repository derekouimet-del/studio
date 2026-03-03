'use server';

/**
 * @fileOverview A Genkit flow that functions as a web crawler and security scanner.
 * Now enhanced with a sophisticated rule-based secret classifier that returns full values.
 *
 * - crawlWebsite - A function that takes a target URL, fetches its content, and analyzes it for pages and secrets.
 * - CrawlWebsiteInput - The input type for the crawlWebsite function.
 * - CrawlWebsiteOutput - The return type for the crawlWebsite function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { classifyText } from '@/lib/secret-classifier';

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
    value: z.string().describe('The discovered credential value (full discovery).'),
    severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
    confidence: z.number().optional(),
    reason: z.string().optional(),
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

const analyzePageContentPrompt = ai.definePrompt({
  name: 'analyzePageContentPrompt',
  input: { schema: z.object({ targetUrl: z.string(), pageContent: z.string() }) },
  output: { schema: CrawlWebsiteOutputSchema },
  prompt: `You are a security scanner analyzing the content of {{{targetUrl}}}. The HTML content is below:
---
{{{pageContent}}}
---
From this HTML, do the following:
1. Extract up to 10 interesting links (<a href...>) from the page. Convert relative URLs to absolute URLs using the targetUrl as the base. For each link, create a PageResult object. Assume a status code of 200. The page title should be extracted from the link's anchor text.
2. Identify potential credentials, hardcoded passwords, or other sensitive data that look out of place.
3. For all results, generate a unique 'id' string.
4. Return a JSON object with 'pages' and 'credentials' arrays. If nothing is found, return empty arrays.`,
});

const crawlWebsiteFlow = ai.defineFlow(
  {
    name: 'crawlWebsiteFlow',
    inputSchema: CrawlWebsiteInputSchema,
    outputSchema: CrawlWebsiteOutputSchema,
  },
  async ({ targetUrl }) => {
    let pageContent: string;
    try {
        const response = await fetch(targetUrl, { headers: { 'User-Agent': 'ProSentry-Crawler/1.0' }});
        if (!response.ok) {
            console.error(`Failed to fetch ${targetUrl}: ${response.status} ${response.statusText}`);
            return { pages: [], credentials: [] };
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            console.error(`Skipping ${targetUrl} because content-type is not text/html.`);
            return { pages: [], credentials: [] };
        }

        pageContent = await response.text();
    } catch (e: any) {
        console.error(`Exception while fetching ${targetUrl}:`, e.message);
        return { pages: [], credentials: [] };
    }
    
    // Step 1: Run the fast rule-based classifier
    const findings = classifyText(pageContent, { url: targetUrl });
    const ruleBasedCredentials = findings.map((f, i) => ({
      id: `rule-${i}`,
      source: targetUrl,
      type: f.type,
      value: f.value, // Now full value
      severity: f.severity,
      confidence: f.confidence,
      reason: f.reason,
    }));

    // Step 2: Run the AI prompt for link extraction and nuanced discovery
    const {output} = await analyzePageContentPrompt({ targetUrl, pageContent });
    
    if (!output) {
      return { pages: [], credentials: ruleBasedCredentials };
    }

    // Merge results
    const mergedCredentials = [...ruleBasedCredentials, ...output.credentials];

    return { 
      pages: output.pages || [], 
      credentials: mergedCredentials 
    };
  }
);