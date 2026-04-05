'use server';

/**
 * @fileOverview Network scan flow that connects to the self-hosted scanner service.
 */

// Scanner service URL - set this in your environment variables
const SCANNER_API_URL = process.env.SCANNER_API_URL || process.env.NEXT_PUBLIC_SCANNER_API_URL;

// Types defined inline to avoid exporting objects from 'use server' file
export type PortScanResult = {
  host: string;
  port: number;
  service: string;
  version: string;
  status: 'Open' | 'Closed' | 'Filtered';
};

export type NetworkScanInput = {
  target: string;
  scanType?: 'quick' | 'standard' | 'deep' | 'stealth';
  ports?: string;
  serviceDetection?: boolean;
  osDetection?: boolean;
  scriptScan?: boolean;
  skipPing?: boolean;
};

export type NetworkScanOutput = {
  results: PortScanResult[];
  rawOutput?: string;
  scanTime?: number;
  command?: string;
};

export async function networkScan(input: NetworkScanInput): Promise<NetworkScanOutput> {
  const { target, scanType, ports, serviceDetection, osDetection, scriptScan, skipPing } = input;

  // Check if scanner service is configured
  if (!SCANNER_API_URL) {
    console.warn('[NetworkScan] SCANNER_API_URL not set, using mock data');
    return generateMockScanResults(target);
  }

  try {
    const response = await fetch(`${SCANNER_API_URL}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target,
        scan_type: scanType || 'standard',
        ports: ports || undefined,
        service_detection: serviceDetection ?? true,
        os_detection: osDetection ?? false,
        script_scan: scriptScan ?? false,
        skip_ping: skipPing ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NetworkScan] Scanner service error:', errorText);
      throw new Error(`Scanner service returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Scan failed');
    }

    // Transform backend response to expected format
    // Backend returns: data.hosts[].ports[] - need to flatten to results[]
    const results: PortScanResult[] = [];
    const hosts = data.data?.hosts || [];
    
    for (const host of hosts) {
      const hostIp = host.ip || host.hostname || target;
      const ports = host.ports || [];
      
      for (const port of ports) {
        results.push({
          host: hostIp,
          port: Number(port.port),
          service: String(port.service || 'unknown'),
          version: String(port.version || ''),
          status: port.state === 'open' ? 'Open' : port.state === 'filtered' ? 'Filtered' : 'Closed',
        });
      }
    }

    return {
      results,
      rawOutput: data.raw_output || data.data?.raw_output,
      scanTime: data.data?.scan_time,
      command: data.command || data.data?.command,
    };
  } catch (error) {
    console.error('[NetworkScan] Error calling scanner service:', error);
    
    // If scanner service is unavailable, fall back to mock data
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('[NetworkScan] Scanner service unreachable, using mock data');
      return generateMockScanResults(target);
    }
    
    throw error;
  }
}

// Generate mock scan results when scanner service is unavailable
function generateMockScanResults(target: string): NetworkScanOutput {
  const commonPorts = [
    { port: 22, service: 'ssh', version: 'OpenSSH 8.9' },
    { port: 80, service: 'http', version: 'nginx 1.24.0' },
    { port: 443, service: 'https', version: 'nginx 1.24.0' },
    { port: 3306, service: 'mysql', version: 'MySQL 8.0.35' },
    { port: 5432, service: 'postgresql', version: 'PostgreSQL 15.4' },
    { port: 6379, service: 'redis', version: 'Redis 7.2.3' },
    { port: 8080, service: 'http-proxy', version: 'Apache Tomcat 10.1' },
    { port: 27017, service: 'mongodb', version: 'MongoDB 7.0.4' },
  ];

  // Randomly select 3-6 ports to simulate findings
  const numPorts = Math.floor(Math.random() * 4) + 3;
  const shuffled = commonPorts.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, numPorts);

  const results: PortScanResult[] = selected.map((p) => ({
    host: target,
    port: p.port,
    service: p.service,
    version: p.version,
    status: 'Open' as const,
  }));

  return {
    results,
    rawOutput: `[DEMO MODE] Mock scan results for ${target}\nScanner service not configured - set SCANNER_API_URL for live scans`,
    scanTime: Math.random() * 5 + 2,
    command: `nmap -sV ${target} [DEMO]`,
  };
}
