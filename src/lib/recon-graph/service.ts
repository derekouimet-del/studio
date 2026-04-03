// Recon Graph Service Layer
// Connects to self-hosted scanner service or falls back to demo mode

import type {
  TargetType,
  ScanMode,
  ScanOptions,
  ReconNode,
  ReconEdge,
  ReconGraphResult,
  ReconSummary,
  RiskLevel,
  SubdomainInfo,
  PortInfo,
  TechnologyInfo,
  CVEInfo,
  SSLInfo,
} from './types';

// Backend scanner URL - set via environment variable
const SCANNER_API_URL = process.env.NEXT_PUBLIC_SCANNER_API_URL || process.env.SCANNER_API_URL;

// ============================================================
// Input Normalization
// ============================================================

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function normalizeTarget(input: string): { 
  isValid: boolean; 
  sanitized: string; 
  type: TargetType | null;
  error?: string;
} {
  const sanitized = input.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  
  if (!sanitized) {
    return { isValid: false, sanitized: '', type: null, error: 'Target cannot be empty' };
  }

  if (IPV4_REGEX.test(sanitized)) {
    return { isValid: true, sanitized, type: 'ip' };
  }

  if (DOMAIN_REGEX.test(sanitized)) {
    const parts = sanitized.split('.');
    const isSubdomain = parts.length > 2 && !['www', 'mail', 'ftp'].includes(parts[0]);
    return { isValid: true, sanitized, type: isSubdomain ? 'subdomain' : 'domain' };
  }

  return { isValid: false, sanitized, type: null, error: 'Invalid target format. Enter a domain, subdomain, or IPv4 address.' };
}

// ============================================================
// Backend API Integration
// ============================================================

interface BackendReconData {
  target: string;
  timestamp: string;
  subdomains: Array<{
    subdomain: string;
    ips: string[];
    status: string;
    source?: string;
    is_root?: boolean;
  }>;
  hosts: Array<{
    hostname: string;
    ip: string;
    status: string;
    latency?: string;
    ports: Array<{
      port: number;
      protocol: string;
      state: string;
      service: string;
      version?: string;
      cves?: Array<{ id: string; cvss: number; description: string }>;
    }>;
    os?: string;
  }>;
  technologies: Array<{
    name: string;
    version?: string;
    confidence: string;
  }>;
  cves: Array<{
    id: string;
    cvss: number;
    description: string;
    source?: string;
  }>;
  ssl_certs: Array<{
    host: string;
    valid: boolean;
    issuer?: string;
    subject?: string;
    not_before?: string;
    not_after?: string;
    san?: string[];
  }>;
  summary: {
    subdomains: number;
    hosts: number;
    open_ports: number;
    technologies: number;
    cves: number;
    critical_cves: number;
    high_cves: number;
    ssl_certs: number;
  };
}

async function callBackendRecon(
  target: string,
  mode: ScanMode,
  options: ScanOptions
): Promise<BackendReconData> {
  if (!SCANNER_API_URL) {
    throw new Error('Scanner service not configured');
  }

  const response = await fetch(`${SCANNER_API_URL}/recon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target,
      mode,
      options: {
        subdomains: options.resolveSubdomains,
        ports: options.checkPorts,
        technologies: options.detectTechnologies,
        cves: options.matchCVEs,
        ssl: options.includeSSL,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Scanner error: ${error}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Scan failed');
  }

  return result.data;
}

async function callBackendValidate(
  type: string,
  target: string,
  data: Record<string, unknown>
): Promise<{
  validated: boolean;
  status: string;
  confidence: number;
  evidence: string[];
  raw_output?: string;
}> {
  if (!SCANNER_API_URL) {
    throw new Error('Scanner service not configured');
  }

  const response = await fetch(`${SCANNER_API_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, target, data }),
  });

  if (!response.ok) {
    throw new Error('Validation request failed');
  }

  const result = await response.json();
  return result.data;
}

// Export for use in validation service
export { callBackendValidate, SCANNER_API_URL };

// ============================================================
// Mock Data Generators (Fallback for Demo Mode)
// ============================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SUBDOMAIN_PREFIXES = [
  'api', 'dev', 'staging', 'mail', 'smtp', 'pop', 'imap', 'ftp', 
  'cdn', 'assets', 'static', 'img', 'images', 'admin', 'portal',
  'vpn', 'remote', 'git', 'gitlab', 'jenkins', 'ci', 'build',
  'test', 'qa', 'uat', 'prod', 'app', 'mobile', 'docs', 'wiki',
];

const COMMON_PORTS: PortInfo[] = [
  { port: 22, protocol: 'tcp', service: 'SSH', version: 'OpenSSH 8.9', state: 'open' },
  { port: 80, protocol: 'tcp', service: 'HTTP', version: 'nginx/1.24.0', state: 'open' },
  { port: 443, protocol: 'tcp', service: 'HTTPS', version: 'nginx/1.24.0', state: 'open' },
  { port: 3306, protocol: 'tcp', service: 'MySQL', version: '8.0.35', state: 'open' },
  { port: 5432, protocol: 'tcp', service: 'PostgreSQL', version: '15.4', state: 'open' },
  { port: 6379, protocol: 'tcp', service: 'Redis', version: '7.2.3', state: 'open' },
  { port: 8080, protocol: 'tcp', service: 'HTTP-Proxy', state: 'open' },
];

const TECHNOLOGIES: TechnologyInfo[] = [
  { name: 'nginx', version: '1.24.0', category: 'Web Server', confidence: 95 },
  { name: 'React', version: '18.2.0', category: 'Frontend Framework', confidence: 92 },
  { name: 'Node.js', version: '20.10.0', category: 'Runtime', confidence: 85 },
  { name: 'WordPress', version: '6.4.2', category: 'CMS', confidence: 95 },
  { name: 'jQuery', version: '3.7.1', category: 'Library', confidence: 98 },
  { name: 'Cloudflare', category: 'CDN/WAF', confidence: 99 },
];

const MOCK_CVES: CVEInfo[] = [
  { id: 'CVE-2024-21762', severity: 'critical', score: 9.8, summary: 'FortiOS SSL VPN out-of-bounds write vulnerability', affectedProduct: 'FortiOS' },
  { id: 'CVE-2023-44487', severity: 'high', score: 7.5, summary: 'HTTP/2 Rapid Reset Attack', affectedProduct: 'nginx' },
  { id: 'CVE-2023-22515', severity: 'critical', score: 9.8, summary: 'Atlassian Confluence broken access control', affectedProduct: 'Confluence' },
];

async function generateMockSubdomains(domain: string, mode: ScanMode): Promise<SubdomainInfo[]> {
  await new Promise(resolve => setTimeout(resolve, randomInt(500, 1500)));
  const count = mode === 'quick' ? randomInt(3, 6) : mode === 'standard' ? randomInt(6, 12) : randomInt(12, 20);
  const prefixes = [...SUBDOMAIN_PREFIXES].sort(() => Math.random() - 0.5).slice(0, count);
  return prefixes.map(prefix => ({
    subdomain: `${prefix}.${domain}`,
    ip: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
    isLive: true,
  }));
}

async function generateMockPorts(mode: ScanMode): Promise<PortInfo[]> {
  await new Promise(resolve => setTimeout(resolve, randomInt(300, 800)));
  const count = mode === 'quick' ? randomInt(2, 4) : mode === 'standard' ? randomInt(4, 7) : randomInt(6, 10);
  return [...COMMON_PORTS].sort(() => Math.random() - 0.5).slice(0, count);
}

async function generateMockTechnologies(): Promise<TechnologyInfo[]> {
  await new Promise(resolve => setTimeout(resolve, randomInt(200, 500)));
  return [...TECHNOLOGIES].sort(() => Math.random() - 0.5).slice(0, randomInt(3, 6));
}

async function generateMockCVEs(): Promise<CVEInfo[]> {
  await new Promise(resolve => setTimeout(resolve, randomInt(300, 700)));
  return [...MOCK_CVES].sort(() => Math.random() - 0.5).slice(0, randomInt(1, 3));
}

async function generateMockSSL(domain: string): Promise<SSLInfo | null> {
  await new Promise(resolve => setTimeout(resolve, randomInt(200, 400)));
  const daysUntilExpiry = randomInt(-30, 365);
  const validFrom = new Date();
  validFrom.setDate(validFrom.getDate() - randomInt(30, 365));
  const validTo = new Date();
  validTo.setDate(validTo.getDate() + daysUntilExpiry);
  
  return {
    issuer: randomPick(["Let's Encrypt", 'DigiCert', 'Cloudflare', 'GlobalSign']),
    validFrom: validFrom.toISOString().split('T')[0],
    validTo: validTo.toISOString().split('T')[0],
    algorithm: randomPick(['RSA-2048', 'RSA-4096', 'ECDSA-P256']),
    isExpired: daysUntilExpiry < 0,
    daysUntilExpiry,
  };
}

// ============================================================
// Risk Calculation
// ============================================================

function calculateRiskLevel(cves: CVEInfo[], ports: PortInfo[], ssl: SSLInfo | null): RiskLevel {
  let riskScore = 0;
  
  for (const cve of cves) {
    if (cve.severity === 'critical') riskScore += 30;
    else if (cve.severity === 'high') riskScore += 20;
    else if (cve.severity === 'medium') riskScore += 10;
    else riskScore += 5;
  }
  
  const dangerousPorts = [6379, 27017, 9200, 11211, 3306, 5432, 1433];
  for (const port of ports) {
    if (dangerousPorts.includes(port.port)) riskScore += 10;
  }
  
  if (!ssl) riskScore += 15;
  else if (ssl.isExpired) riskScore += 20;
  else if (ssl.daysUntilExpiry < 30) riskScore += 5;
  
  if (riskScore >= 60) return 'critical';
  if (riskScore >= 40) return 'high';
  if (riskScore >= 20) return 'medium';
  return 'low';
}

// ============================================================
// Graph Builder
// ============================================================

export async function buildReconGraph(
  target: string,
  targetType: TargetType,
  mode: ScanMode,
  options: ScanOptions
): Promise<ReconGraphResult> {
  const nodes: ReconNode[] = [];
  const edges: ReconEdge[] = [];
  let isLiveData = false;
  
  // Root node
  const rootId = `root-${generateId()}`;
  nodes.push({
    id: rootId,
    type: 'root',
    label: target,
    metadata: { targetType },
  });
  
  let allSubdomains: SubdomainInfo[] = [];
  let allPorts: PortInfo[] = [];
  let allTechnologies: TechnologyInfo[] = [];
  let allCVEs: CVEInfo[] = [];
  let sslInfo: SSLInfo | null = null;

  // Try backend scanner first
  if (SCANNER_API_URL) {
    try {
      console.log('[v0] Attempting to connect to scanner service:', SCANNER_API_URL);
      const backendData = await callBackendRecon(target, mode, options);
      isLiveData = true;
      console.log('[v0] Backend scan successful, processing results');
      
      // Convert backend data to our internal format
      allSubdomains = backendData.subdomains.map(s => ({
        subdomain: s.subdomain,
        ip: s.ips[0] || '',
        isLive: s.status === 'active',
      }));
      
      allPorts = backendData.hosts.flatMap(h => 
        h.ports.filter(p => p.state === 'open').map(p => ({
          port: p.port,
          protocol: p.protocol as 'tcp' | 'udp',
          service: p.service,
          version: p.version,
          state: p.state,
        }))
      );
      
      allTechnologies = backendData.technologies.map(t => ({
        name: t.name,
        version: t.version,
        category: 'Detected',
        confidence: t.confidence === 'high' ? 90 : t.confidence === 'medium' ? 70 : 50,
      }));
      
      allCVEs = backendData.cves.map(c => ({
        id: c.id,
        severity: c.cvss >= 9 ? 'critical' : c.cvss >= 7 ? 'high' : c.cvss >= 4 ? 'medium' : 'low',
        score: c.cvss,
        summary: c.description,
        affectedProduct: c.source,
      }));
      
      if (backendData.ssl_certs.length > 0) {
        const cert = backendData.ssl_certs[0];
        const notAfter = cert.not_after ? new Date(cert.not_after) : new Date();
        const daysUntilExpiry = Math.floor((notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        sslInfo = {
          issuer: cert.issuer || 'Unknown',
          validFrom: cert.not_before || '',
          validTo: cert.not_after || '',
          algorithm: 'Unknown',
          isExpired: daysUntilExpiry < 0,
          daysUntilExpiry,
        };
      }
    } catch (error) {
      console.warn('[v0] Backend scanner unavailable, falling back to demo mode:', error);
    }
  }

  // Fallback to mock data if backend unavailable
  if (!isLiveData) {
    console.log('[v0] Running in DEMO MODE - no scanner service configured');
    
    // Phase 1: Subdomain Discovery
    if ((targetType === 'domain' || targetType === 'subdomain') && options.resolveSubdomains) {
      const baseDomain = targetType === 'subdomain' 
        ? target.split('.').slice(-2).join('.') 
        : target;
      allSubdomains = await generateMockSubdomains(baseDomain, mode);
    }
    
    // Phase 2: Port Scanning
    if (options.checkPorts) {
      allPorts = await generateMockPorts(mode);
    }
    
    // Phase 3: Technology Detection
    if (options.detectTechnologies) {
      allTechnologies = await generateMockTechnologies();
    }
    
    // Phase 4: CVE Matching
    if (options.matchCVEs && mode !== 'quick') {
      allCVEs = await generateMockCVEs();
    }
    
    // Phase 5: SSL Info
    if (options.includeSSL && targetType !== 'ip' && mode !== 'quick') {
      sslInfo = await generateMockSSL(target);
    }
  }

  // Build graph nodes and edges
  for (const sub of allSubdomains) {
    const subId = `subdomain-${generateId()}`;
    nodes.push({
      id: subId,
      type: 'subdomain',
      label: sub.subdomain,
      metadata: { ip: sub.ip },
    });
    edges.push({
      id: `edge-${generateId()}`,
      source: rootId,
      target: subId,
      label: 'subdomain',
    });
    
    const ipId = `ip-${generateId()}`;
    nodes.push({
      id: ipId,
      type: 'ip',
      label: sub.ip,
    });
    edges.push({
      id: `edge-${generateId()}`,
      source: subId,
      target: ipId,
      label: 'resolves',
    });
  }

  // Add IP node for root if direct IP scan
  if (targetType === 'ip') {
    const ipId = `ip-${generateId()}`;
    nodes.push({ id: ipId, type: 'ip', label: target });
    edges.push({ id: `edge-${generateId()}`, source: rootId, target: ipId, label: 'resolves' });
  }

  // Service nodes
  for (const port of allPorts) {
    const serviceId = `service-${generateId()}`;
    nodes.push({
      id: serviceId,
      type: 'service',
      label: `${port.port}/${port.service}`,
      metadata: { 
        port: port.port, 
        protocol: port.protocol, 
        version: port.version,
        state: port.state,
      },
    });
    edges.push({
      id: `edge-${generateId()}`,
      source: rootId,
      target: serviceId,
      label: 'port',
    });
  }

  // Technology nodes
  for (const tech of allTechnologies) {
    const techId = `tech-${generateId()}`;
    nodes.push({
      id: techId,
      type: 'technology',
      label: tech.version ? `${tech.name} ${tech.version}` : tech.name,
      metadata: { category: tech.category, confidence: tech.confidence, version: tech.version },
    });
    edges.push({
      id: `edge-${generateId()}`,
      source: rootId,
      target: techId,
      label: 'uses',
    });
  }

  // CVE nodes
  for (const cve of allCVEs) {
    const cveId = `cve-${generateId()}`;
    nodes.push({
      id: cveId,
      type: 'cve',
      label: cve.id,
      riskLevel: cve.severity,
      metadata: { score: cve.score, summary: cve.summary, affectedProduct: cve.affectedProduct },
    });
    edges.push({
      id: `edge-${generateId()}`,
      source: rootId,
      target: cveId,
      label: 'vulnerable',
    });
  }

  // SSL node
  if (sslInfo) {
    const sslId = `ssl-${generateId()}`;
    const sslRisk: RiskLevel = sslInfo.isExpired ? 'high' : sslInfo.daysUntilExpiry < 30 ? 'medium' : 'low';
    nodes.push({
      id: sslId,
      type: 'ssl',
      label: `SSL (${sslInfo.issuer})`,
      riskLevel: sslRisk,
      metadata: { ...sslInfo },
    });
    edges.push({
      id: `edge-${generateId()}`,
      source: rootId,
      target: sslId,
      label: 'certificate',
    });
  }

  // Risk node
  const overallRisk = calculateRiskLevel(allCVEs, allPorts, sslInfo);
  if (overallRisk === 'critical' || overallRisk === 'high') {
    const riskId = `risk-${generateId()}`;
    nodes.push({
      id: riskId,
      type: 'risk',
      label: `${overallRisk.toUpperCase()} RISK`,
      riskLevel: overallRisk,
      metadata: {
        cveCount: allCVEs.length,
        criticalCVEs: allCVEs.filter(c => c.severity === 'critical').length,
        highCVEs: allCVEs.filter(c => c.severity === 'high').length,
      },
    });
    edges.push({
      id: `edge-${generateId()}`,
      source: rootId,
      target: riskId,
      label: 'assessment',
    });
  }

  const summary: ReconSummary = {
    totalNodes: nodes.length,
    subdomains: nodes.filter(n => n.type === 'subdomain').length,
    ips: nodes.filter(n => n.type === 'ip').length,
    services: nodes.filter(n => n.type === 'service').length,
    cves: nodes.filter(n => n.type === 'cve').length,
    risks: nodes.filter(n => n.type === 'risk').length,
  };

  return {
    target,
    targetType,
    scanMode: mode,
    summary,
    nodes,
    edges,
    overallRisk,
    scanTimestamp: new Date().toISOString(),
    isLiveData,
  };
}

// ============================================================
// Export Functions
// ============================================================

export function exportToJSON(result: ReconGraphResult): string {
  return JSON.stringify(result, null, 2);
}

export function exportToCSV(result: ReconGraphResult): string {
  const rows: string[] = [];
  rows.push('Type,Label,Risk Level,Metadata');
  
  for (const node of result.nodes) {
    const metadata = node.metadata ? JSON.stringify(node.metadata).replace(/"/g, '""') : '';
    rows.push(`"${node.type}","${node.label}","${node.riskLevel || 'N/A'}","${metadata}"`);
  }
  
  return rows.join('\n');
}
