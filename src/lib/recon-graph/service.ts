// Recon Graph Service Layer
// This module provides mock data with a clean interface for future live integrations

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
// Mock Data Generators
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
  'blog', 'shop', 'store', 'billing', 'support', 'help', 'status',
];

const COMMON_PORTS: PortInfo[] = [
  { port: 21, protocol: 'tcp', service: 'FTP', state: 'open' },
  { port: 22, protocol: 'tcp', service: 'SSH', version: 'OpenSSH 8.9', state: 'open' },
  { port: 25, protocol: 'tcp', service: 'SMTP', state: 'open' },
  { port: 53, protocol: 'udp', service: 'DNS', state: 'open' },
  { port: 80, protocol: 'tcp', service: 'HTTP', version: 'nginx/1.24.0', state: 'open' },
  { port: 443, protocol: 'tcp', service: 'HTTPS', version: 'nginx/1.24.0', state: 'open' },
  { port: 3306, protocol: 'tcp', service: 'MySQL', version: '8.0.35', state: 'open' },
  { port: 5432, protocol: 'tcp', service: 'PostgreSQL', version: '15.4', state: 'open' },
  { port: 6379, protocol: 'tcp', service: 'Redis', version: '7.2.3', state: 'open' },
  { port: 8080, protocol: 'tcp', service: 'HTTP-Proxy', state: 'open' },
  { port: 8443, protocol: 'tcp', service: 'HTTPS-Alt', state: 'open' },
  { port: 27017, protocol: 'tcp', service: 'MongoDB', version: '7.0.4', state: 'open' },
];

const TECHNOLOGIES: TechnologyInfo[] = [
  { name: 'nginx', version: '1.24.0', category: 'Web Server', confidence: 95 },
  { name: 'Apache', version: '2.4.58', category: 'Web Server', confidence: 90 },
  { name: 'Node.js', version: '20.10.0', category: 'Runtime', confidence: 85 },
  { name: 'React', version: '18.2.0', category: 'Frontend Framework', confidence: 92 },
  { name: 'Next.js', version: '14.0.4', category: 'Framework', confidence: 88 },
  { name: 'WordPress', version: '6.4.2', category: 'CMS', confidence: 95 },
  { name: 'PHP', version: '8.2.13', category: 'Language', confidence: 80 },
  { name: 'jQuery', version: '3.7.1', category: 'Library', confidence: 98 },
  { name: 'Bootstrap', version: '5.3.2', category: 'CSS Framework', confidence: 90 },
  { name: 'Cloudflare', category: 'CDN/WAF', confidence: 99 },
  { name: 'Docker', category: 'Container', confidence: 70 },
  { name: 'Kubernetes', category: 'Orchestration', confidence: 60 },
];

const MOCK_CVES: CVEInfo[] = [
  { id: 'CVE-2024-21762', severity: 'critical', score: 9.8, summary: 'FortiOS SSL VPN out-of-bounds write vulnerability allowing RCE', affectedProduct: 'FortiOS' },
  { id: 'CVE-2024-3400', severity: 'critical', score: 10.0, summary: 'PAN-OS command injection in GlobalProtect gateway', affectedProduct: 'PAN-OS' },
  { id: 'CVE-2024-1709', severity: 'critical', score: 10.0, summary: 'ConnectWise ScreenConnect authentication bypass', affectedProduct: 'ScreenConnect' },
  { id: 'CVE-2023-44487', severity: 'high', score: 7.5, summary: 'HTTP/2 Rapid Reset Attack (affects nginx, Apache)', affectedProduct: 'nginx' },
  { id: 'CVE-2023-46747', severity: 'critical', score: 9.8, summary: 'F5 BIG-IP unauthenticated RCE via request smuggling', affectedProduct: 'BIG-IP' },
  { id: 'CVE-2023-34362', severity: 'critical', score: 9.8, summary: 'MOVEit Transfer SQL injection leading to RCE', affectedProduct: 'MOVEit' },
  { id: 'CVE-2023-22515', severity: 'critical', score: 9.8, summary: 'Atlassian Confluence broken access control', affectedProduct: 'Confluence' },
  { id: 'CVE-2023-4966', severity: 'critical', score: 9.4, summary: 'Citrix NetScaler session token leak (Citrix Bleed)', affectedProduct: 'NetScaler' },
  { id: 'CVE-2023-36884', severity: 'high', score: 8.8, summary: 'Microsoft Office RCE via malicious documents', affectedProduct: 'Office' },
  { id: 'CVE-2023-27350', severity: 'critical', score: 9.8, summary: 'PaperCut MF/NG authentication bypass and RCE', affectedProduct: 'PaperCut' },
];

// ============================================================
// Discovery Functions
// ============================================================

export async function discoverSubdomains(domain: string, mode: ScanMode): Promise<SubdomainInfo[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, randomInt(500, 1500)));
  
  const count = mode === 'quick' ? randomInt(3, 6) : mode === 'standard' ? randomInt(6, 12) : randomInt(12, 20);
  const prefixes = [...SUBDOMAIN_PREFIXES].sort(() => Math.random() - 0.5).slice(0, count);
  
  return prefixes.map(prefix => ({
    subdomain: `${prefix}.${domain}`,
    ip: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
    isLive: Math.random() > 0.1,
  })).filter(s => s.isLive);
}

export async function resolveIPs(targets: string[]): Promise<Map<string, string>> {
  await new Promise(resolve => setTimeout(resolve, randomInt(200, 600)));
  
  const results = new Map<string, string>();
  for (const target of targets) {
    results.set(target, `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`);
  }
  return results;
}

export async function scanPorts(ip: string, mode: ScanMode): Promise<PortInfo[]> {
  await new Promise(resolve => setTimeout(resolve, randomInt(300, 800)));
  
  const portCount = mode === 'quick' ? randomInt(2, 4) : mode === 'standard' ? randomInt(4, 7) : randomInt(6, 10);
  return [...COMMON_PORTS].sort(() => Math.random() - 0.5).slice(0, portCount);
}

export async function detectTechnologies(target: string): Promise<TechnologyInfo[]> {
  await new Promise(resolve => setTimeout(resolve, randomInt(200, 500)));
  
  const count = randomInt(3, 7);
  return [...TECHNOLOGIES].sort(() => Math.random() - 0.5).slice(0, count);
}

export async function matchCVEs(technologies: TechnologyInfo[], services: PortInfo[]): Promise<CVEInfo[]> {
  await new Promise(resolve => setTimeout(resolve, randomInt(300, 700)));
  
  // Match some CVEs based on detected tech/services
  const matchedCVEs: CVEInfo[] = [];
  const cvePool = [...MOCK_CVES];
  
  // Add 1-4 CVEs based on probability
  const count = randomInt(1, 4);
  for (let i = 0; i < count && cvePool.length > 0; i++) {
    const idx = randomInt(0, cvePool.length - 1);
    matchedCVEs.push(cvePool.splice(idx, 1)[0]);
  }
  
  return matchedCVEs;
}

export async function getSSLInfo(domain: string): Promise<SSLInfo | null> {
  await new Promise(resolve => setTimeout(resolve, randomInt(200, 400)));
  
  if (Math.random() > 0.8) return null; // 20% chance no SSL
  
  const daysUntilExpiry = randomInt(-30, 365);
  const validFrom = new Date();
  validFrom.setDate(validFrom.getDate() - randomInt(30, 365));
  const validTo = new Date();
  validTo.setDate(validTo.getDate() + daysUntilExpiry);
  
  return {
    issuer: randomPick(["Let's Encrypt", 'DigiCert', 'Comodo', 'GlobalSign', 'Sectigo']),
    validFrom: validFrom.toISOString().split('T')[0],
    validTo: validTo.toISOString().split('T')[0],
    algorithm: randomPick(['RSA-2048', 'RSA-4096', 'ECDSA-P256', 'ECDSA-P384']),
    isExpired: daysUntilExpiry < 0,
    daysUntilExpiry,
  };
}

// ============================================================
// Risk Calculation
// ============================================================

function calculateRiskLevel(cves: CVEInfo[], ports: PortInfo[], ssl: SSLInfo | null): RiskLevel {
  let riskScore = 0;
  
  // CVE-based risk
  for (const cve of cves) {
    if (cve.severity === 'critical') riskScore += 30;
    else if (cve.severity === 'high') riskScore += 20;
    else if (cve.severity === 'medium') riskScore += 10;
    else riskScore += 5;
  }
  
  // Dangerous open ports
  const dangerousPorts = [21, 23, 3389, 1433, 3306, 5432, 27017, 6379];
  for (const port of ports) {
    if (dangerousPorts.includes(port.port)) riskScore += 10;
  }
  
  // SSL issues
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
  
  // Phase 1: Subdomain Discovery
  if ((targetType === 'domain' || targetType === 'subdomain') && options.resolveSubdomains) {
    const baseDomain = targetType === 'subdomain' 
      ? target.split('.').slice(-2).join('.') 
      : target;
    
    allSubdomains = await discoverSubdomains(baseDomain, mode);
    
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
      
      // Add IP node for each subdomain
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
  }
  
  // Phase 2: Port Scanning
  if (options.checkPorts) {
    const ipsToScan = targetType === 'ip' 
      ? [target] 
      : allSubdomains.slice(0, mode === 'deep' ? 5 : 3).map(s => s.ip);
    
    for (const ip of ipsToScan) {
      const ports = await scanPorts(ip, mode);
      allPorts.push(...ports);
      
      // Find or create IP node
      let ipNode = nodes.find(n => n.type === 'ip' && n.label === ip);
      if (!ipNode) {
        const ipId = `ip-${generateId()}`;
        ipNode = { id: ipId, type: 'ip', label: ip };
        nodes.push(ipNode);
        edges.push({
          id: `edge-${generateId()}`,
          source: rootId,
          target: ipId,
          label: 'resolves',
        });
      }
      
      for (const port of ports) {
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
          source: ipNode.id,
          target: serviceId,
          label: 'port',
        });
      }
    }
  }
  
  // Phase 3: Technology Detection
  if (options.detectTechnologies) {
    allTechnologies = await detectTechnologies(target);
    
    for (const tech of allTechnologies) {
      const techId = `tech-${generateId()}`;
      nodes.push({
        id: techId,
        type: 'technology',
        label: tech.version ? `${tech.name} ${tech.version}` : tech.name,
        metadata: { category: tech.category, confidence: tech.confidence },
      });
      edges.push({
        id: `edge-${generateId()}`,
        source: rootId,
        target: techId,
        label: 'uses',
      });
    }
  }
  
  // Phase 4: CVE Matching
  if (options.matchCVEs && mode !== 'quick') {
    allCVEs = await matchCVEs(allTechnologies, allPorts);
    
    for (const cve of allCVEs) {
      const cveId = `cve-${generateId()}`;
      nodes.push({
        id: cveId,
        type: 'cve',
        label: cve.id,
        riskLevel: cve.severity,
        metadata: { score: cve.score, summary: cve.summary, affectedProduct: cve.affectedProduct },
      });
      
      // Link CVE to related technology or root
      const relatedTech = allTechnologies.find(t => 
        cve.affectedProduct?.toLowerCase().includes(t.name.toLowerCase())
      );
      const techNode = relatedTech 
        ? nodes.find(n => n.type === 'technology' && n.label.toLowerCase().includes(relatedTech.name.toLowerCase()))
        : null;
      
      edges.push({
        id: `edge-${generateId()}`,
        source: techNode?.id || rootId,
        target: cveId,
        label: 'vulnerable',
      });
    }
  }
  
  // Phase 5: SSL Info
  if (options.includeSSL && targetType !== 'ip' && mode !== 'quick') {
    sslInfo = await getSSLInfo(target);
    
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
  }
  
  // Add risk markers
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
  
  // Build summary
  const summary: ReconSummary = {
    totalNodes: nodes.length,
    subdomains: nodes.filter(n => n.type === 'subdomain').length,
    ips: nodes.filter(n => n.type === 'ip').length,
    services: nodes.filter(n => n.type === 'service').length,
    cves: nodes.filter(n => n.type === 'cve').length,
    risks: nodes.filter(n => n.type === 'risk').length + (overallRisk === 'high' || overallRisk === 'critical' ? 1 : 0),
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
