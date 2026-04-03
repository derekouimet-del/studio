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

// Use a function to dynamically construct module paths to prevent webpack static analysis
// This is necessary because webpack traces even dynamic imports with string literals
async function loadFlow(flowName: string): Promise<Record<string, unknown>> {
  // Use string concatenation to prevent webpack from analyzing the import path
  const basePath = '../../../ai/flows/';
  const modulePath = basePath + flowName;
  return import(modulePath);
}

export async function POST(request: NextRequest) {
  try {
    const { action, input } = await request.json() as { action: ActionName; input: unknown };

    switch (action) {
      case 'assessVulnerability': {
        const mod = await loadFlow('vulnerability-assessment') as { assessVulnerability: (input: unknown) => Promise<unknown> };
        const result = await mod.assessVulnerability(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'suggestExploits': {
        const mod = await loadFlow('exploit-suggestion') as { suggestExploits: (input: unknown) => Promise<unknown> };
        const result = await mod.suggestExploits(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'crawlWebsite': {
        const mod = await loadFlow('web-crawler') as { crawlWebsite: (input: unknown) => Promise<unknown> };
        const result = await mod.crawlWebsite(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'suggestWordlist': {
        const mod = await loadFlow('wordlist-suggestion') as { suggestWordlist: (input: unknown) => Promise<unknown> };
        const result = await mod.suggestWordlist(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'agentChat': {
        const mod = await loadFlow('agent-chat') as { agentChat: (input: unknown) => Promise<unknown> };
        const result = await mod.agentChat(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'nmapSuggestion': {
        const mod = await loadFlow('nmap-suggestion') as { nmapSuggestion: (input: unknown) => Promise<unknown> };
        const result = await mod.nmapSuggestion(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'generateBreachedPasswords': {
        const mod = await loadFlow('generate-breached-passwords') as { generateBreachedPasswords: (input: unknown) => Promise<unknown> };
        const result = await mod.generateBreachedPasswords(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'checkPasswordStrength': {
        const mod = await loadFlow('check-password-strength') as { checkPasswordStrength: (input: unknown) => Promise<unknown> };
        const result = await mod.checkPasswordStrength(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'analyzeContentAuthenticity': {
        const mod = await loadFlow('content-authenticity') as { analyzeContentAuthenticity: (input: unknown) => Promise<unknown> };
        const result = await mod.analyzeContentAuthenticity(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'runLlamaTool': {
        const mod = await loadFlow('run-llama-tool') as { runLlamaTool: (input: unknown) => Promise<{ ok: boolean; error?: string }> };
        const result = await mod.runLlamaTool(input);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error || 'The Llama tool failed.' });
        }
        return NextResponse.json({ success: true, data: result });
      }
      case 'attackSurfaceMapper': {
        const mod = await loadFlow('attack-surface-mapper') as { mapAttackSurface: (input: unknown) => Promise<unknown> };
        const result = await mod.mapAttackSurface(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'vulndbExplorer': {
        const mod = await loadFlow('vulndb-explorer') as { vulndbExplorer: (input: unknown) => Promise<unknown> };
        const result = await mod.vulndbExplorer(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'defaultPass': {
        const mod = await loadFlow('default-pass') as { defaultPass: (input: unknown) => Promise<unknown> };
        const result = await mod.defaultPass(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'textToSpeech': {
        const mod = await loadFlow('text-to-speech') as { textToSpeech: (input: unknown) => Promise<unknown> };
        const result = await mod.textToSpeech(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'threatView': {
        const mod = await loadFlow('threat-view') as { threatView: (input: unknown) => Promise<unknown> };
        const result = await mod.threatView(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'dataSieve': {
        const mod = await loadFlow('data-sieve') as { dataSieve: (input: unknown) => Promise<unknown> };
        const result = await mod.dataSieve(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'networkScan': {
        const mod = await loadFlow('network-scan') as { networkScan: (input: unknown) => Promise<unknown> };
        const result = await mod.networkScan(input);
        return NextResponse.json({ success: true, data: result });
      }
      case 'cveMonitor': {
        const mod = await loadFlow('cve-monitor') as { getLatestVulnerabilities: () => Promise<unknown> };
        const result = await mod.getLatestVulnerabilities();
        return NextResponse.json({ success: true, data: result });
      }
      case 'fofaSuggestion': {
        const mod = await loadFlow('fofa-suggestion') as { fofaSuggestion: (input: unknown) => Promise<unknown> };
        const result = await mod.fofaSuggestion(input);
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
