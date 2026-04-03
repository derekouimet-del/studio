import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ActionName =
  | 'assessVulnerability'
  | 'suggestExploits'
  | 'crawlWebsite'
  | 'suggestWordlist'
  | 'agentChat'
  | 'nmapSuggestion'
  | 'generateBreachedPasswords'
  | 'checkPasswordStrength'
  | 'analyzeContentAuthenticity'
  | 'runLlamaTool'
  | 'attackSurfaceMapper'
  | 'vulndbExplorer'
  | 'defaultPass'
  | 'textToSpeech'
  | 'threatView'
  | 'dataSieve'
  | 'networkScan'
  | 'cveMonitor'
  | 'fofaSuggestion';

export async function POST(request: NextRequest) {
  try {
    const { action, input } = await request.json() as { action: ActionName; input: unknown };

    switch (action) {
      case 'assessVulnerability': {
        const { assessVulnerability } = await import('@/ai/flows/vulnerability-assessment');
        const result = await assessVulnerability(input as Parameters<typeof assessVulnerability>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'suggestExploits': {
        const { suggestExploits } = await import('@/ai/flows/exploit-suggestion');
        const result = await suggestExploits(input as Parameters<typeof suggestExploits>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'crawlWebsite': {
        const { crawlWebsite } = await import('@/ai/flows/web-crawler');
        const result = await crawlWebsite(input as Parameters<typeof crawlWebsite>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'suggestWordlist': {
        const { suggestWordlist } = await import('@/ai/flows/wordlist-suggestion');
        const result = await suggestWordlist(input as Parameters<typeof suggestWordlist>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'agentChat': {
        const { agentChat } = await import('@/ai/flows/agent-chat');
        const result = await agentChat(input as Parameters<typeof agentChat>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'nmapSuggestion': {
        const { nmapSuggestion } = await import('@/ai/flows/nmap-suggestion');
        const result = await nmapSuggestion(input as Parameters<typeof nmapSuggestion>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'generateBreachedPasswords': {
        const { generateBreachedPasswords } = await import('@/ai/flows/generate-breached-passwords');
        const result = await generateBreachedPasswords(input as Parameters<typeof generateBreachedPasswords>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'checkPasswordStrength': {
        const { checkPasswordStrength } = await import('@/ai/flows/check-password-strength');
        const result = await checkPasswordStrength(input as Parameters<typeof checkPasswordStrength>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'analyzeContentAuthenticity': {
        const { analyzeContentAuthenticity } = await import('@/ai/flows/content-authenticity');
        const result = await analyzeContentAuthenticity(input as Parameters<typeof analyzeContentAuthenticity>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'runLlamaTool': {
        const { runLlamaTool } = await import('@/ai/flows/run-llama-tool');
        const result = await runLlamaTool(input as Parameters<typeof runLlamaTool>[0]);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error || 'The Llama tool failed.' });
        }
        return NextResponse.json({ success: true, data: result });
      }
      case 'attackSurfaceMapper': {
        const { mapAttackSurface } = await import('@/ai/flows/attack-surface-mapper');
        const result = await mapAttackSurface(input as Parameters<typeof mapAttackSurface>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'vulndbExplorer': {
        const { vulndbExplorer } = await import('@/ai/flows/vulndb-explorer');
        const result = await vulndbExplorer(input as Parameters<typeof vulndbExplorer>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'defaultPass': {
        const { defaultPass } = await import('@/ai/flows/default-pass');
        const result = await defaultPass(input as Parameters<typeof defaultPass>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'textToSpeech': {
        const { textToSpeech } = await import('@/ai/flows/text-to-speech');
        const result = await textToSpeech(input as Parameters<typeof textToSpeech>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'threatView': {
        const { threatView } = await import('@/ai/flows/threat-view');
        const result = await threatView(input as Parameters<typeof threatView>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'dataSieve': {
        const { dataSieve } = await import('@/ai/flows/data-sieve');
        const result = await dataSieve(input as Parameters<typeof dataSieve>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'networkScan': {
        const { networkScan } = await import('@/ai/flows/network-scan');
        const result = await networkScan(input as Parameters<typeof networkScan>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'cveMonitor': {
        const { getLatestVulnerabilities } = await import('@/ai/flows/cve-monitor');
        const result = await getLatestVulnerabilities();
        return NextResponse.json({ success: true, data: result });
      }
      case 'fofaSuggestion': {
        const { fofaSuggestion } = await import('@/ai/flows/fofa-suggestion');
        const result = await fofaSuggestion(input as Parameters<typeof fofaSuggestion>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('AI API error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
