'use server';

/**
 * @fileOverview Kali Forge flow that connects to the self-hosted scanner service
 * to execute Kali Linux commands and return results.
 */

// Scanner service URL - uses the same service as network-scan
const SCANNER_API_URL = process.env.SCANNER_API_URL || process.env.NEXT_PUBLIC_SCANNER_API_URL;

export type KaliForgeInput = {
  command: string;
  timeout?: number; // Timeout in seconds, defaults to 120
};

export type KaliForgeOutput = {
  success: boolean;
  command: string;
  output: string;
  exitCode?: number;
  executionTime?: number;
  error?: string;
};

export async function kaliForge(input: KaliForgeInput): Promise<KaliForgeOutput> {
  const { command, timeout = 120 } = input;

  // Basic validation
  if (!command || command.trim().length === 0) {
    return {
      success: false,
      command,
      output: '',
      error: 'Command cannot be empty',
    };
  }

  // Check if scanner service is configured
  if (!SCANNER_API_URL) {
    console.warn('[KaliForge] SCANNER_API_URL not set, returning demo response');
    return generateMockResponse(command);
  }

  try {
    const response = await fetch(`${SCANNER_API_URL}/kali`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        timeout,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[KaliForge] Scanner service error:', errorText);
      
      // 404 means the /kali endpoint doesn't exist on the backend yet
      if (response.status === 404) {
        return {
          success: false,
          command,
          output: '',
          error: 'The /kali endpoint is not available on your scanner service. Please update your penquest-scanner-service.py with the latest version from the repository and restart the service.',
        };
      }
      
      throw new Error(`Scanner service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        command,
        output: data.output || '',
        exitCode: data.exit_code,
        executionTime: data.execution_time,
        error: data.error || 'Command execution failed',
      };
    }

    return {
      success: true,
      command: data.command || command,
      output: data.output || '',
      exitCode: data.exit_code ?? 0,
      executionTime: data.execution_time,
    };
  } catch (error) {
    console.error('[KaliForge] Error calling scanner service:', error);

    // If scanner service is unavailable, fall back to mock response
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('[KaliForge] Scanner service unreachable, using mock response');
      return generateMockResponse(command);
    }

    return {
      success: false,
      command,
      output: '',
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// Generate mock response when scanner service is unavailable
function generateMockResponse(command: string): KaliForgeOutput {
  const tool = command.split(' ')[0];
  
  const mockResponses: Record<string, string> = {
    'whoami': 'kali',
    'id': 'uid=1000(kali) gid=1000(kali) groups=1000(kali),27(sudo)',
    'uname': 'Linux',
    'pwd': '/home/kali',
    'date': new Date().toUTCString(),
    'hostname': 'kali-forge-demo',
  };

  if (mockResponses[tool]) {
    return {
      success: true,
      command,
      output: `[DEMO MODE] ${mockResponses[tool]}\n\n---\nScanner service not configured - set SCANNER_API_URL for live command execution`,
      exitCode: 0,
      executionTime: 0.05,
    };
  }

  return {
    success: true,
    command,
    output: `[DEMO MODE] Kali Forge would execute: ${command}\n\n---\nScanner service not configured - set SCANNER_API_URL for live command execution\n\nSupported tools include:\n- nmap, nikto, gobuster, dirb, wfuzz\n- sqlmap, hydra, john, hashcat\n- metasploit, searchsploit\n- netcat, socat, tcpdump\n- And many more Kali Linux tools`,
    exitCode: 0,
    executionTime: 0.01,
  };
}
