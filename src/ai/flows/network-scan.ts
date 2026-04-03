'use server';

/**
 * @fileOverview Network scan flow that connects to the self-hosted scanner service.
 *
 * - networkScan - A function that takes a target and scan options, returns open ports and services.
 * - NetworkScanInput - The input type for the function.
 * - NetworkScanOutput - The return type for the function.
 */

import { z } from 'zod';

// Scanner service URL - set this in your environment variables
const SCANNER_API_URL = process.env.SCANNER_API_URL || process.env.NEXT_PUBLIC_SCANNER_API_URL;

const PortScanResultSchema = z.object({
  host: z.string().describe('The IP address of the scanned host.'),
  port: z.number().describe('The port number.'),
  service: z.string().describe('The service name running on the port.'),
  version: z.string().describe('The version of the service.'),
  status: z.enum(['Open', 'Closed', 'Filtered']).describe('The status of the port.'),
});
export type PortScanResult = z.infer<typeof PortScanResultSchema>;

export const NetworkScanInputSchema = z.object({
  target: z.string().describe('The IP address, domain, or CIDR range to scan.'),
  scanType: z.enum(['quick', 'standard', 'deep', 'stealth']).optional().default('standard'),
  ports: z.string().optional().describe('Custom port range, e.g., "22,80,443" or "1-1000"'),
  serviceDetection: z.boolean().optional().default(true),
  osDetection: z.boolean().optional().default(false),
  scriptScan: z.boolean().optional().default(false),
});
export type NetworkScanInput = z.infer<typeof NetworkScanInputSchema>;

const NetworkScanOutputSchema = z.object({
  results: z.array(PortScanResultSchema).describe('A list of discovered open ports and services.'),
  rawOutput: z.string().optional().describe('Raw nmap output'),
  scanTime: z.number().optional().describe('Scan duration in seconds'),
  command: z.string().optional().describe('The nmap command that was executed'),
});
export type NetworkScanOutput = z.infer<typeof NetworkScanOutputSchema>;

export async function networkScan(input: NetworkScanInput): Promise<NetworkScanOutput> {
  const { target, scanType, ports, serviceDetection, osDetection, scriptScan } = input;

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
    const results: PortScanResult[] = (data.data?.results || []).map((r: Record<string, unknown>) => ({
      host: String(r.host || target),
      port: Number(r.port),
      service: String(r.service || 'unknown'),
      version: String(r.version || ''),
      status: (r.status as 'Open' | 'Closed' | 'Filtered') || 'Open',
    }));

    return {
      results,
      rawOutput: data.data?.raw_output,
      scanTime: data.data?.scan_time,
      command: data.data?.command,
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
