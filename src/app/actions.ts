
'use server';

import { assessVulnerability, type VulnerabilityAssessmentInput } from '@/ai/flows/vulnerability-assessment';
import { suggestExploits, type ExploitSuggestionInput } from '@/ai/flows/exploit-suggestion';
import { crawlWebsite, type CrawlWebsiteInput } from '@/ai/flows/web-crawler';
import { suggestWordlist, type WordlistSuggestionInput } from '@/ai/flows/wordlist-suggestion';
import { agentChat, type AgentChatInput } from '@/ai/flows/agent-chat';
import { nmapSuggestion, type NmapSuggestionInput } from '@/ai/flows/nmap-suggestion';

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

export async function suggestWordlistAction(input: WordlistSuggestionInput) {
  try {
    const result = await suggestWordlist(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Wordlist suggestion failed:', error);
    return { success: false, error: 'An error occurred while generating suggestions.' };
  }
}

export async function agentChatAction(input: AgentChatInput) {
  try {
    const result = await agentChat(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Agent chat failed:', error);
    return { success: false, error: 'An error occurred while talking to the agent.' };
  }
}

export async function nmapSuggestionAction(input: NmapSuggestionInput) {
    try {
        const result = await nmapSuggestion(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Nmap suggestion failed:', error);
        return { success: false, error: 'An error occurred while generating the nmap command.' };
    }
}
