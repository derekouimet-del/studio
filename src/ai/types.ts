/**
 * @fileOverview Shared type definitions for AI flows.
 * This file contains only TypeScript types and interfaces, with no runtime imports.
 * It's safe to import in both client and server components.
 */

// Agent Chat
export interface AgentChatInput {
  history: { role: 'user' | 'model'; content: string }[];
  message: string;
}

export interface AgentChatOutput {
  response: string;
}

// Vulnerability Assessment
export interface VulnerabilityAssessmentInput {
  targetDescription: string;
  scanResults?: string;
}

export interface VulnerabilityAssessmentOutput {
  vulnerabilities: {
    name: string;
    severity: string;
    description: string;
    recommendation: string;
  }[];
}

// Exploit Suggestion
export interface ExploitSuggestionInput {
  vulnerabilityName: string;
  targetSystem: string;
}

export interface ExploitSuggestionOutput {
  exploits: {
    name: string;
    description: string;
    difficulty: string;
    prerequisites: string;
  }[];
}

// Web Crawler
export interface CrawlWebsiteInput {
  targetUrl: string;
}

export interface CrawlWebsiteOutput {
  pages: {
    id: string;
    url: string;
    statusCode: number;
    title: string;
  }[];
  credentials: {
    id: string;
    source: string;
    type: string;
    value: string;
    severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
    confidence?: number;
    reason?: string;
  }[];
}

// Wordlist Suggestion
export interface WordlistSuggestionInput {
  context: string;
  existingWords?: string[];
}

export interface WordlistSuggestionOutput {
  words: string[];
}

// Nmap Suggestion
export interface NmapSuggestionInput {
  target: string;
  objective: string;
}

export interface NmapSuggestionOutput {
  command: string;
  explanation: string;
}

// Generate Breached Passwords
export interface GenerateBreachedPasswordsInput {
  pattern: string;
  count?: number;
}

export interface GenerateBreachedPasswordsOutput {
  passwords: string[];
}

// Check Password Strength
export interface CheckPasswordStrengthInput {
  password: string;
}

export interface CheckPasswordStrengthOutput {
  score: number;
  feedback: string;
  suggestions: string[];
}

// Content Authenticity
export interface ContentAuthenticityInput {
  contentType: 'text' | 'image' | 'audio' | 'video';
  textContent?: string;
  fileDataUri?: string;
}

export interface ContentAuthenticityOutput {
  aiLikelihood: number;
  reasoning: string;
}

// Llama Tool
export interface LlamaToolInput {
  tool: string;
  input: string;
}

export interface LlamaToolOutput {
  ok: boolean;
  output?: string;
  error?: string;
}

// Attack Surface Mapper
export interface AttackSurfaceMapperInput {
  target: string;
}

export interface AttackSurfaceMapperOutput {
  surfaces: {
    name: string;
    type: string;
    risk: string;
    description: string;
  }[];
}

// VulnDB Explorer
export interface VulnDBExplorerInput {
  query: string;
}

export interface VulnDBExplorerOutput {
  vulnerabilities: {
    id: string;
    name: string;
    severity: string;
    description: string;
  }[];
}

// Default Pass
export interface DefaultPassInput {
  device: string;
}

export interface DefaultPassOutput {
  credentials: {
    username: string;
    password: string;
    source: string;
  }[];
}

// Text to Speech
export interface TextToSpeechInput {
  text: string;
  voice?: string;
}

export interface TextToSpeechOutput {
  audioUrl: string;
}

// Threat View
export interface ThreatViewInput {
  query: string;
}

export interface ThreatViewOutput {
  results: {
    ipAddress: string;
    location: string;
    banner: string;
    notes: string;
  }[];
}

// Data Sieve
export interface DataSieveInput {
  content: string;
}

export interface DataSieveOutput {
  foundData: {
    id: string;
    type: string;
    value: string;
    context?: string;
    severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  }[];
}

// Network Scan
export interface NetworkScanInput {
  target: string;
  scanType?: 'quick' | 'standard' | 'deep' | 'stealth';
  ports?: string;
  serviceDetection?: boolean;
  osDetection?: boolean;
  scriptScan?: boolean;
}

export type PortScanResult = {
  host: string;
  port: number;
  service: string;
  version: string;
  status: 'Open' | 'Closed' | 'Filtered';
};

export interface NetworkScanOutput {
  results: PortScanResult[];
  rawOutput?: string;
  scanTime?: number;
  command?: string;
}

// CVE Monitor
export interface CVEItem {
  id: string;
  summary: string;
  cvss: number | null;
  severity: string | null;
  published: string;
  lastModified: string;
  attackVector: string | null;
  cweId: string | null;
  references: string[];
}

export interface CVEMonitorOutput {
  vulnerabilities: CVEItem[];
  aiSummary: string;
  criticalCount: number;
  highCount: number;
  lastFetchTime: string;
}

// FOFA Suggestion
export interface FofaSuggestionInput {
  query: string;
}

export interface FofaSuggestionOutput {
  fofaQuery: string;
  explanation: string;
}
