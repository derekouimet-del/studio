'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { classifyText } from '@/lib/secret-classifier';

const PageResultSchema = z.object({
  id: z.string(), url: z.string(), statusCode: z.number(), title: z.string(), depth: z.number(), fetched: z.boolean(),
});
const CredentialResultSchema = z.object({
  id: z.string(), source: z.string(), type: z.string(), value: z.string(), severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(), confidence: z.number().optional(), reason: z.string().optional(),
});
const CrawlWebsiteInputSchema = z.object({
  targetUrl: z.string(), maxDepth: z.number().int().min(0).max(2).default(1), maxPages: z.number().int().min(1).max(25).default(12), sameOriginOnly: z.boolean().default(true),
});
export type CrawlWebsiteInput = z.input<typeof CrawlWebsiteInputSchema>;
const CrawlWebsiteOutputSchema = z.object({ pages: z.array(PageResultSchema), credentials: z.array(CredentialResultSchema) });
export type CrawlWebsiteOutput = z.infer<typeof CrawlWebsiteOutputSchema>;

type Page = z.infer<typeof PageResultSchema>;
const crawlerHeaders = { 'User-Agent': 'Pen-Quest-Crawler/2.0' };
const skipAsset = /\.(?:css|js|mjs|map|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|pdf|zip|mp[34]|webm)(?:[?#].*)?$/i;

function extractLinks(html: string, baseUrl: string, origin: string, sameOriginOnly: boolean) {
  const links: { url: string; title: string }[] = [];
  const pattern = /<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const href = match[2].trim();
    if (!href || /^(?:mailto:|tel:|javascript:|data:)/i.test(href) || href.startsWith('#')) continue;
    try {
      const url = new URL(href, baseUrl);
      if (!/^https?:$/.test(url.protocol) || skipAsset.test(url.pathname) || (sameOriginOnly && url.origin !== origin)) continue;
      url.hash = '';
      const normalized = url.href;
      if (!links.some((link) => link.url === normalized)) links.push({ url: normalized, title: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || normalized });
    } catch { /* ignore malformed URLs */ }
  }
  return links;
}

async function fetchPage(url: string) {
  const response = await fetch(url, { headers: crawlerHeaders, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const contentType = response.headers.get('content-type') || '';
  const html = contentType.includes('text/html') ? await response.text() : '';
  return { response, html };
}

export async function crawlWebsite(input: CrawlWebsiteInput): Promise<CrawlWebsiteOutput> {
  return crawlWebsiteFlow({ targetUrl: input.targetUrl, maxDepth: input.maxDepth ?? 1, maxPages: input.maxPages ?? 12, sameOriginOnly: input.sameOriginOnly ?? true });
}

const crawlWebsiteFlow = ai.defineFlow({ name: 'crawlWebsiteFlow', inputSchema: CrawlWebsiteInputSchema, outputSchema: CrawlWebsiteOutputSchema }, async (input) => {
  let url = input.targetUrl.trim();
  if (!url) throw new Error('Enter a website URL to crawl.');
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const rootUrl = new URL(url); rootUrl.hash = ''; url = rootUrl.href;
  const maxDepth = input.maxDepth ?? 1, maxPages = input.maxPages ?? 12, sameOriginOnly = input.sameOriginOnly ?? true;
  let rootFetch: Awaited<ReturnType<typeof fetchPage>>;
  try { rootFetch = await fetchPage(url); } catch (error) { throw new Error(`Could not reach ${url}: ${error instanceof Error ? error.message : 'request failed'}`); }
  if (!rootFetch.response.headers.get('content-type')?.includes('text/html')) throw new Error('The target returned a non-HTML response.');

  const pages: Page[] = [{ id: 'root', url, statusCode: rootFetch.response.status, title: rootFetch.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || url, depth: 0, fetched: true }];
  const credentials = classifyText(rootFetch.html, { url }).map((finding, i) => ({ id: `root-${i}`, source: url, type: finding.type, value: finding.value, severity: finding.severity, confidence: finding.confidence, reason: finding.reason }));
  let frontier = extractLinks(rootFetch.html, url, rootUrl.origin, sameOriginOnly).map((link) => ({ ...link, depth: 1 }));
  const seen = new Set([url]);
  while (frontier.length && pages.filter((page) => page.fetched).length < maxPages) {
    const batch = frontier.splice(0, Math.min(4, maxPages - pages.filter((page) => page.fetched).length));
    const results = await Promise.all(batch.map(async (candidate, index) => {
      if (seen.has(candidate.url)) return { candidate, index, result: null as Awaited<ReturnType<typeof fetchPage>> | null, error: true };
      seen.add(candidate.url);
      try { return { candidate, index, result: await fetchPage(candidate.url), error: false }; } catch { return { candidate, index, result: null, error: true }; }
    }));
    for (const { candidate, index, result, error } of results) {
      if (error || !result) { pages.push({ id: `page-${pages.length}`, url: candidate.url, title: candidate.title, statusCode: 0, depth: candidate.depth, fetched: false }); continue; }
      const title = result.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || candidate.title;
      pages.push({ id: `page-${pages.length}`, url: candidate.url, title, statusCode: result.response.status, depth: candidate.depth, fetched: true });
      credentials.push(...classifyText(result.html, { url: candidate.url }).map((finding, findingIndex) => ({ id: `${pages.length}-${index}-${findingIndex}`, source: candidate.url, type: finding.type, value: finding.value, severity: finding.severity, confidence: finding.confidence, reason: finding.reason })));
      if (candidate.depth < maxDepth) frontier.push(...extractLinks(result.html, candidate.url, rootUrl.origin, sameOriginOnly).filter((link) => !seen.has(link.url)).map((link) => ({ ...link, depth: candidate.depth + 1 })));
    }
  }
  for (const candidate of frontier) if (!pages.some((page) => page.url === candidate.url) && pages.length < maxPages + 50) pages.push({ id: `discovered-${pages.length}`, url: candidate.url, title: candidate.title, statusCode: 0, depth: candidate.depth, fetched: false });
  return { pages, credentials };
});

