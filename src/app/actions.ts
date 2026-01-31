
'use server';

import { assessVulnerability, type VulnerabilityAssessmentInput } from '@/ai/flows/vulnerability-assessment';
import { suggestExploits, type ExploitSuggestionInput } from '@/ai/flows/exploit-suggestion';

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
