// Recon Graph Type Definitions

export type TargetType = 'domain' | 'subdomain' | 'ip';
export type ScanMode = 'quick' | 'standard' | 'deep';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type NodeType = 
  | 'root' 
  | 'subdomain' 
  | 'ip' 
  | 'service' 
  | 'technology' 
  | 'cve' 
  | 'ssl' 
  | 'risk';

export interface ReconNode {
  id: string;
  type: NodeType;
  label: string;
  riskLevel?: RiskLevel;
  metadata?: Record<string, unknown>;
}

export interface ReconEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ReconSummary {
  totalNodes: number;
  subdomains: number;
  ips: number;
  services: number;
  cves: number;
  risks: number;
}

export interface ReconGraphResult {
  target: string;
  targetType: TargetType;
  scanMode: ScanMode;
  summary: ReconSummary;
  nodes: ReconNode[];
  edges: ReconEdge[];
  overallRisk: RiskLevel;
  scanTimestamp: string;
  isLiveData?: boolean;
}

export interface ScanOptions {
  resolveSubdomains: boolean;
  checkPorts: boolean;
  detectTechnologies: boolean;
  matchCVEs: boolean;
  includeSSL: boolean;
}

export interface ScanRequest {
  target: string;
  mode: ScanMode;
  options: ScanOptions;
}

// Port and Service definitions
export interface PortInfo {
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  version?: string;
  state: 'open' | 'closed' | 'filtered';
}

export interface SubdomainInfo {
  subdomain: string;
  ip: string;
  isLive: boolean;
}

export interface TechnologyInfo {
  name: string;
  version?: string;
  category: string;
  confidence: number;
}

export interface CVEInfo {
  id: string;
  severity: RiskLevel;
  score: number;
  summary: string;
  affectedProduct?: string;
}

export interface SSLInfo {
  issuer: string;
  validFrom: string;
  validTo: string;
  algorithm: string;
  isExpired: boolean;
  daysUntilExpiry: number;
}
