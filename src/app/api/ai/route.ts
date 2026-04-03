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

// Use a function to get the module path to prevent webpack static analysis
function getFlowPath(flowName: string): string {
  return `@/ai/flows/${flowName}`;
}

export async function POST(request: NextRequest) {
  try {
    const { action, input } = await request.json() as { action: ActionName; input: unknown };

    switch (action) {
      case 'assessVulnerability': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/vulnerability-assessment');
        const result = await mod.assessVulnerability(input as Parameters<typeof mod.assessVulnerability>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'suggestExploits': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/exploit-suggestion');
        const result = await mod.suggestExploits(input as Parameters<typeof mod.suggestExploits>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'crawlWebsite': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/web-crawler');
        const result = await mod.crawlWebsite(input as Parameters<typeof mod.crawlWebsite>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'suggestWordlist': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/wordlist-suggestion');
        const result = await mod.suggestWordlist(input as Parameters<typeof mod.suggestWordlist>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'agentChat': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/agent-chat');
        const result = await mod.agentChat(input as Parameters<typeof mod.agentChat>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'nmapSuggestion': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/nmap-suggestion');
        const result = await mod.nmapSuggestion(input as Parameters<typeof mod.nmapSuggestion>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'generateBreachedPasswords': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/generate-breached-passwords');
        const result = await mod.generateBreachedPasswords(input as Parameters<typeof mod.generateBreachedPasswords>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'checkPasswordStrength': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/check-password-strength');
        const result = await mod.checkPasswordStrength(input as Parameters<typeof mod.checkPasswordStrength>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'analyzeContentAuthenticity': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/content-authenticity');
        const result = await mod.analyzeContentAuthenticity(input as Parameters<typeof mod.analyzeContentAuthenticity>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'runLlamaTool': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/run-llama-tool');
        const result = await mod.runLlamaTool(input as Parameters<typeof mod.runLlamaTool>[0]);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error || 'The Llama tool failed.' });
        }
        return NextResponse.json({ success: true, data: result });
      }
      case 'attackSurfaceMapper': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/attack-surface-mapper');
        const result = await mod.mapAttackSurface(input as Parameters<typeof mod.mapAttackSurface>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'vulndbExplorer': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/vulndb-explorer');
        const result = await mod.vulndbExplorer(input as Parameters<typeof mod.vulndbExplorer>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'defaultPass': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/default-pass');
        const result = await mod.defaultPass(input as Parameters<typeof mod.defaultPass>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'textToSpeech': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/text-to-speech');
        const result = await mod.textToSpeech(input as Parameters<typeof mod.textToSpeech>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'threatView': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/threat-view');
        const result = await mod.threatView(input as Parameters<typeof mod.threatView>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'dataSieve': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/data-sieve');
        const result = await mod.dataSieve(input as Parameters<typeof mod.dataSieve>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'networkScan': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/network-scan');
        const result = await mod.networkScan(input as Parameters<typeof mod.networkScan>[0]);
        return NextResponse.json({ success: true, data: result });
      }
      case 'cveMonitor': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/cve-monitor');
        const result = await mod.getLatestVulnerabilities();
        return NextResponse.json({ success: true, data: result });
      }
      case 'fofaSuggestion': {
        const mod = await import(/* webpackIgnore: true */ '@/ai/flows/fofa-suggestion');
        const result = await mod.fofaSuggestion(input as Parameters<typeof mod.fofaSuggestion>[0]);
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
