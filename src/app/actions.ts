'use server';

import { assessVulnerability, type VulnerabilityAssessmentInput } from '@/ai/flows/vulnerability-assessment';
import { suggestExploits, type ExploitSuggestionInput } from '@/ai/flows/exploit-suggestion';
import { crawlWebsite, type CrawlWebsiteInput } from '@/ai/flows/web-crawler';
import { suggestWordlist, type WordlistSuggestionInput } from '@/ai/flows/wordlist-suggestion';
import { agentChat, type AgentChatInput } from '@/ai/flows/agent-chat';
import { nmapSuggestion, type NmapSuggestionInput } from '@/ai/flows/nmap-suggestion';
import { generateBreachedPasswords, type GenerateBreachedPasswordsInput } from '@/ai/flows/generate-breached-passwords';
import { checkPasswordStrength, type CheckPasswordStrengthInput } from '@/ai/flows/check-password-strength';
import { analyzeContentAuthenticity, type ContentAuthenticityInput } from '@/ai/flows/content-authenticity';
import { runLlamaTool, type LlamaToolInput, type LlamaToolOutput } from '@/ai/flows/run-llama-tool';
import { mapAttackSurface, type AttackSurfaceMapperInput } from '@/ai/flows/attack-surface-mapper';
import { vulndbExplorer, type VulnDBExplorerInput } from '@/ai/flows/vulndb-explorer';
import { defaultPass, type DefaultPassInput } from '@/ai/flows/default-pass';
import { textToSpeech, type TextToSpeechInput } from '@/ai/flows/text-to-speech';
import { getVoices, cloneVoice, deleteVoice, type ElevenLabsVoice, type VoiceCloneOptions } from '@/lib/elevenlabs';
import { threatView, type ThreatViewInput } from '@/ai/flows/threat-view';
import { dataSieve, type DataSieveInput } from '@/ai/flows/data-sieve';
import { networkScan, type NetworkScanInput } from '@/ai/flows/network-scan';
import { getLatestVulnerabilities, type CVEMonitorOutput } from '@/ai/flows/cve-monitor';
import { fofaSuggestion, type FofaSuggestionInput } from '@/ai/flows/fofa-suggestion';
import { shodanSuggestion, type ShodanSuggestionInput } from '@/ai/flows/shodan-suggestion';
import { kaliForge, type KaliForgeInput } from '@/ai/flows/kali-forge';
import { portForwardTest, type PortForwardTestInput } from '@/ai/flows/port-forward-test';
import { oracle, type OracleInput } from '@/ai/flows/oracle';
import { coder, type CoderInput } from '@/ai/flows/coder';

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

export async function generateBreachedPasswordsAction(input: GenerateBreachedPasswordsInput) {
  try {
    const result = await generateBreachedPasswords(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Breached password generation failed:', error);
    return { success: false, error: 'An error occurred while generating passwords.' };
  }
}

export async function checkPasswordStrengthAction(input: CheckPasswordStrengthInput) {
  try {
    const result = await checkPasswordStrength(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Password strength check failed:', error);
    return { success: false, error: 'An error occurred while checking password strength.' };
  }
}

export async function analyzeContentAuthenticityAction(input: ContentAuthenticityInput) {
  try {
    const result = await analyzeContentAuthenticity(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Content authenticity analysis failed:', error);
    return { success: false, error: 'An error occurred while analyzing the content.' };
  }
}

export async function runLlamaToolAction(input: LlamaToolInput): Promise<{ success: boolean; data?: LlamaToolOutput; error?: string }> {
  try {
    const result = await runLlamaTool(input);
    if (!result.ok) {
      return { success: false, error: result.error || 'The Llama tool failed without a specific error message.' };
    }
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Llama tool action failed:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while running the Llama tool.' };
  }
}

export async function attackSurfaceMapperAction(input: AttackSurfaceMapperInput) {
  try {
    const result = await mapAttackSurface(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Attack surface mapping failed:', error);
    return { success: false, error: 'An error occurred while mapping the attack surface.' };
  }
}

export async function vulndbExplorerAction(input: VulnDBExplorerInput) {
  try {
    const result = await vulndbExplorer(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('VulnDB Explorer failed:', error);
    return { success: false, error: 'An error occurred while searching for vulnerabilities.' };
  }
}

export async function defaultPassAction(input: DefaultPassInput) {
  try {
    const result = await defaultPass(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Default Pass lookup failed:', error);
    return { success: false, error: 'An error occurred while searching for default credentials.' };
  }
}

export async function textToSpeechAction(input: TextToSpeechInput) {
  try {
    const result = await textToSpeech(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Text-to-speech failed:', error);
    return { success: false, error: error.message || 'An error occurred during audio generation.' };
  }
}

export async function threatViewAction(input: ThreatViewInput) {
  try {
    const result = await threatView(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('ThreatView search failed:', error);
    return { success: false, error: 'An error occurred while searching for threats.' };
  }
}

export async function dataSieveAction(input: DataSieveInput) {
  try {
    const result = await dataSieve(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('DataSieve analysis failed:', error);
    return { success: false, error: error.message || 'An error occurred while analyzing the file.' };
  }
}

export async function networkScanAction(input: NetworkScanInput) {
  try {
    const result = await networkScan(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Network scan failed:', error);
    return { success: false, error: error.message || 'An error occurred during the network scan.' };
  }
}

export async function cveMonitorAction(): Promise<{ success: boolean; data?: CVEMonitorOutput; error?: string }> {
  try {
    const result = await getLatestVulnerabilities();
    return { success: true, data: result };
  } catch (error: any) {
    console.error('CVE Monitor action failed:', error);
    return { success: false, error: error.message || 'An error occurred while fetching the CVE feed.' };
  }
}

export async function fofaSuggestionAction(input: FofaSuggestionInput) {
    try {
        const result = await fofaSuggestion(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('FOFA suggestion failed:', error);
        return { success: false, error: 'An error occurred while generating the FOFA query.' };
    }
}

export async function shodanSuggestionAction(input: ShodanSuggestionInput) {
    try {
        const result = await shodanSuggestion(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Shodan suggestion failed:', error);
        return { success: false, error: 'An error occurred while generating the Shodan query.' };
    }
}

export async function kaliForgeAction(input: KaliForgeInput) {
  try {
    const result = await kaliForge(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Kali Forge execution failed:', error);
    return { success: false, error: error.message || 'An error occurred while executing the command.' };
  }
}

export async function portForwardTestAction(input: PortForwardTestInput) {
  console.log('[v0] portForwardTestAction called with:', JSON.stringify(input));
  try {
    const result = await portForwardTest(input);
    console.log('[v0] portForwardTestAction result:', JSON.stringify(result));
    return { success: true, data: result };
  } catch (error: any) {
    console.error('[v0] Port forward test failed:', error);
    return { success: false, error: error.message || 'An error occurred while testing ports.' };
  }
}

export async function oracleAction(input: OracleInput) {
  try {
    const result = await oracle(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Oracle action failed:', error);
    return { success: false, error: error.message || 'An error occurred while communicating with Oracle.' };
  }
}

export async function coderAction(input: CoderInput) {
  try {
    const result = await coder(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Coder action failed:', error);
    return { success: false, error: error.message || 'An error occurred while generating code.' };
  }
}

export async function listVoicesAction(): Promise<{ success: boolean; data?: ElevenLabsVoice[]; error?: string }> {
  try {
    const voices = await getVoices();
    return { success: true, data: voices };
  } catch (error: any) {
    console.error('List voices failed:', error);
    return { success: false, error: error.message || 'Failed to fetch available voices.' };
  }
}

export interface VoiceCloneInput {
  name: string;
  description?: string;
  audioFiles: { data: string; filename: string }[];
}

export async function voiceCloneAction(input: VoiceCloneInput): Promise<{ success: boolean; data?: { voice_id: string }; error?: string }> {
  try {
    if (!input.audioFiles || input.audioFiles.length === 0) {
      return { success: false, error: 'At least one audio file is required for voice cloning.' };
    }
    
    const result = await cloneVoice(input.audioFiles, {
      name: input.name,
      description: input.description,
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Voice clone failed:', error);
    return { success: false, error: error.message || 'Failed to clone voice.' };
  }
}

export async function deleteVoiceAction(voiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteVoice(voiceId);
    return { success: true };
  } catch (error: any) {
    console.error('Delete voice failed:', error);
    return { success: false, error: error.message || 'Failed to delete voice.' };
  }
}
