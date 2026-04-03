'use server';

// Import types from a clean types file that has no runtime dependencies
import type {
  VulnerabilityAssessmentInput,
  ExploitSuggestionInput,
  CrawlWebsiteInput,
  WordlistSuggestionInput,
  AgentChatInput,
  NmapSuggestionInput,
  GenerateBreachedPasswordsInput,
  CheckPasswordStrengthInput,
  ContentAuthenticityInput,
  LlamaToolInput,
  LlamaToolOutput,
  AttackSurfaceMapperInput,
  VulnDBExplorerInput,
  DefaultPassInput,
  TextToSpeechInput,
  ThreatViewInput,
  DataSieveInput,
  NetworkScanInput,
  CVEMonitorOutput,
  FofaSuggestionInput,
} from '@/ai/types';

export async function assessVulnerabilityAction(input: VulnerabilityAssessmentInput) {
  try {
    const { assessVulnerability } = await import('@/ai/flows/vulnerability-assessment');
    const result = await assessVulnerability(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Vulnerability assessment failed:', error);
    return { success: false, error: 'An error occurred while assessing vulnerabilities.' };
  }
}

export async function suggestExploitsAction(input: ExploitSuggestionInput) {
  try {
    const { suggestExploits } = await import('@/ai/flows/exploit-suggestion');
    const result = await suggestExploits(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Exploit suggestion failed:', error);
    return { success: false, error: 'An error occurred while suggesting exploits.' };
  }
}

export async function crawlWebsiteAction(input: CrawlWebsiteInput) {
  try {
    const { crawlWebsite } = await import('@/ai/flows/web-crawler');
    const result = await crawlWebsite(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Web crawl failed:', error);
    return { success: false, error: 'An error occurred while crawling the website.' };
  }
}

export async function suggestWordlistAction(input: WordlistSuggestionInput) {
  try {
    const { suggestWordlist } = await import('@/ai/flows/wordlist-suggestion');
    const result = await suggestWordlist(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Wordlist suggestion failed:', error);
    return { success: false, error: 'An error occurred while generating suggestions.' };
  }
}

export async function agentChatAction(input: AgentChatInput) {
  try {
    const { agentChat } = await import('@/ai/flows/agent-chat');
    const result = await agentChat(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Agent chat failed:', error);
    return { success: false, error: 'An error occurred while talking to the agent.' };
  }
}

export async function nmapSuggestionAction(input: NmapSuggestionInput) {
  try {
    const { nmapSuggestion } = await import('@/ai/flows/nmap-suggestion');
    const result = await nmapSuggestion(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Nmap suggestion failed:', error);
    return { success: false, error: 'An error occurred while generating the nmap command.' };
  }
}

export async function generateBreachedPasswordsAction(input: GenerateBreachedPasswordsInput) {
  try {
    const { generateBreachedPasswords } = await import('@/ai/flows/generate-breached-passwords');
    const result = await generateBreachedPasswords(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Breached password generation failed:', error);
    return { success: false, error: 'An error occurred while generating passwords.' };
  }
}

export async function checkPasswordStrengthAction(input: CheckPasswordStrengthInput) {
  try {
    const { checkPasswordStrength } = await import('@/ai/flows/check-password-strength');
    const result = await checkPasswordStrength(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Password strength check failed:', error);
    return { success: false, error: 'An error occurred while checking password strength.' };
  }
}

export async function analyzeContentAuthenticityAction(input: ContentAuthenticityInput) {
  try {
    const { analyzeContentAuthenticity } = await import('@/ai/flows/content-authenticity');
    const result = await analyzeContentAuthenticity(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Content authenticity analysis failed:', error);
    return { success: false, error: 'An error occurred while analyzing the content.' };
  }
}

export async function runLlamaToolAction(input: LlamaToolInput): Promise<{ success: boolean; data?: LlamaToolOutput; error?: string }> {
  try {
    const { runLlamaTool } = await import('@/ai/flows/run-llama-tool');
    const result = await runLlamaTool(input);
    if (!result.ok) {
      return { success: false, error: result.error || 'The Llama tool failed without a specific error message.' };
    }
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Llama tool action failed:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while running the Llama tool.';
    return { success: false, error: message };
  }
}

export async function attackSurfaceMapperAction(input: AttackSurfaceMapperInput) {
  try {
    const { mapAttackSurface } = await import('@/ai/flows/attack-surface-mapper');
    const result = await mapAttackSurface(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Attack surface mapping failed:', error);
    return { success: false, error: 'An error occurred while mapping the attack surface.' };
  }
}

export async function vulndbExplorerAction(input: VulnDBExplorerInput) {
  try {
    const { vulndbExplorer } = await import('@/ai/flows/vulndb-explorer');
    const result = await vulndbExplorer(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('VulnDB Explorer failed:', error);
    return { success: false, error: 'An error occurred while searching for vulnerabilities.' };
  }
}

export async function defaultPassAction(input: DefaultPassInput) {
  try {
    const { defaultPass } = await import('@/ai/flows/default-pass');
    const result = await defaultPass(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Default Pass lookup failed:', error);
    return { success: false, error: 'An error occurred while searching for default credentials.' };
  }
}

export async function textToSpeechAction(input: TextToSpeechInput) {
  try {
    const { textToSpeech } = await import('@/ai/flows/text-to-speech');
    const result = await textToSpeech(input);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Text-to-speech failed:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during audio generation.';
    return { success: false, error: message };
  }
}

export async function threatViewAction(input: ThreatViewInput) {
  try {
    const { threatView } = await import('@/ai/flows/threat-view');
    const result = await threatView(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('ThreatView search failed:', error);
    return { success: false, error: 'An error occurred while searching for threats.' };
  }
}

export async function dataSieveAction(input: DataSieveInput) {
  try {
    const { dataSieve } = await import('@/ai/flows/data-sieve');
    const result = await dataSieve(input);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('DataSieve analysis failed:', error);
    const message = error instanceof Error ? error.message : 'An error occurred while analyzing the file.';
    return { success: false, error: message };
  }
}

export async function networkScanAction(input: NetworkScanInput) {
  try {
    const { networkScan } = await import('@/ai/flows/network-scan');
    const result = await networkScan(input);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Network scan failed:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during the network scan.';
    return { success: false, error: message };
  }
}

export async function cveMonitorAction(): Promise<{ success: boolean; data?: CVEMonitorOutput; error?: string }> {
  try {
    const { getLatestVulnerabilities } = await import('@/ai/flows/cve-monitor');
    const result = await getLatestVulnerabilities();
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('CVE Monitor action failed:', error);
    const message = error instanceof Error ? error.message : 'An error occurred while fetching the CVE feed.';
    return { success: false, error: message };
  }
}

export async function fofaSuggestionAction(input: FofaSuggestionInput) {
  try {
    const { fofaSuggestion } = await import('@/ai/flows/fofa-suggestion');
    const result = await fofaSuggestion(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('FOFA suggestion failed:', error);
    return { success: false, error: 'An error occurred while generating the FOFA query.' };
  }
}
