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

// Helper to call the AI API route
async function callAIAPI<T>(action: string, input?: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, input }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`AI API call failed for ${action}:`, error);
    return { success: false, error: 'An error occurred while calling the AI service.' };
  }
}

export async function assessVulnerabilityAction(input: VulnerabilityAssessmentInput) {
  return callAIAPI('assessVulnerability', input);
}

export async function suggestExploitsAction(input: ExploitSuggestionInput) {
  return callAIAPI('suggestExploits', input);
}

export async function crawlWebsiteAction(input: CrawlWebsiteInput) {
  return callAIAPI('crawlWebsite', input);
}

export async function suggestWordlistAction(input: WordlistSuggestionInput) {
  return callAIAPI('suggestWordlist', input);
}

export async function agentChatAction(input: AgentChatInput) {
  return callAIAPI('agentChat', input);
}

export async function nmapSuggestionAction(input: NmapSuggestionInput) {
  return callAIAPI('nmapSuggestion', input);
}

export async function generateBreachedPasswordsAction(input: GenerateBreachedPasswordsInput) {
  return callAIAPI('generateBreachedPasswords', input);
}

export async function checkPasswordStrengthAction(input: CheckPasswordStrengthInput) {
  return callAIAPI('checkPasswordStrength', input);
}

export async function analyzeContentAuthenticityAction(input: ContentAuthenticityInput) {
  return callAIAPI('analyzeContentAuthenticity', input);
}

export async function runLlamaToolAction(input: LlamaToolInput): Promise<{ success: boolean; data?: LlamaToolOutput; error?: string }> {
  return callAIAPI<LlamaToolOutput>('runLlamaTool', input);
}

export async function attackSurfaceMapperAction(input: AttackSurfaceMapperInput) {
  return callAIAPI('attackSurfaceMapper', input);
}

export async function vulndbExplorerAction(input: VulnDBExplorerInput) {
  return callAIAPI('vulndbExplorer', input);
}

export async function defaultPassAction(input: DefaultPassInput) {
  return callAIAPI('defaultPass', input);
}

export async function textToSpeechAction(input: TextToSpeechInput) {
  return callAIAPI('textToSpeech', input);
}

export async function threatViewAction(input: ThreatViewInput) {
  return callAIAPI('threatView', input);
}

export async function dataSieveAction(input: DataSieveInput) {
  return callAIAPI('dataSieve', input);
}

export async function networkScanAction(input: NetworkScanInput) {
  return callAIAPI('networkScan', input);
}

export async function cveMonitorAction(): Promise<{ success: boolean; data?: CVEMonitorOutput; error?: string }> {
  return callAIAPI<CVEMonitorOutput>('cveMonitor');
}

export async function fofaSuggestionAction(input: FofaSuggestionInput) {
  return callAIAPI('fofaSuggestion', input);
}
