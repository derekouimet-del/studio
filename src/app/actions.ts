
'use server';

import { assessVulnerability, type VulnerabilityAssessmentInput } from '@/ai/flows/vulnerability-assessment';
import { suggestExploits, type ExploitSuggestionInput } from '@/ai/flows/exploit-suggestion';
import { crawlWebsite, type CrawlWebsiteInput } from '@/ai/flows/web-crawler';

export async function assessVulnerabilityAction(input: VulnerabilityAssessmentInput) {
  try {
    const result = await assessVulnerability(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Vulnerability assessment failed:', error);
    return { success: false, error: 'An error occurred while assessing vulnerabilities.' };
  }
}

export async function suggestExploitsAction(input: ExploitSuggestionInput) {
  try {
    const result = await suggestExploits(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Exploit suggestion failed:', error);
    return { success: false, error: 'An error occurred while suggesting exploits.' };
  }
}

export async function crawlWebsiteAction(input: CrawlWebsiteInput) {
  try {
    const result = await crawlWebsite(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Web crawl failed:', error);
    return { success: false, error: 'An error occurred while crawling the website.' };
  }
}
