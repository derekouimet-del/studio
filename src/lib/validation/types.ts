// Finding Validation Type Definitions

export type FindingVerificationStatus =
  | 'detected'
  | 'confirmed'
  | 'likely_vulnerable'
  | 'needs_manual_review'
  | 'false_positive_suspected';

export interface FindingVerification {
  findingId: string;
  status: FindingVerificationStatus;
  confidence: number;
  evidence: string[];
  rationale: string;
  remediation: string[];
  checkedAt: string;
}

export interface ServiceValidationInput {
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  version?: string;
  targetHost: string;
}

export interface TechnologyValidationInput {
  name: string;
  version?: string;
  category: string;
  targetHost: string;
}

export interface CVEValidationInput {
  cveId: string;
  affectedProduct?: string;
  affectedVersion?: string;
  score: number;
  targetHost: string;
}

export interface SSLValidationInput {
  issuer: string;
  validFrom: string;
  validTo: string;
  algorithm: string;
  targetHost: string;
}

export interface EndpointValidationInput {
  url: string;
  type: 'admin_panel' | 'debug_page' | 'api_endpoint' | 'login_form' | 'config_file';
  targetHost: string;
}

export interface ValidationContext {
  targetHost: string;
  nodeType: string;
  nodeId: string;
  metadata?: Record<string, unknown>;
}

// Status display configuration
export const STATUS_CONFIG: Record<FindingVerificationStatus, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  detected: {
    label: 'Detected',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Finding has been detected but not yet verified.',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    description: 'Finding has been confirmed through active verification.',
  },
  likely_vulnerable: {
    label: 'Likely Vulnerable',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    description: 'Evidence strongly suggests this is a real vulnerability.',
  },
  needs_manual_review: {
    label: 'Needs Manual Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Automated checks inconclusive. Manual verification recommended.',
  },
  false_positive_suspected: {
    label: 'False Positive Suspected',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    description: 'Evidence suggests this may be a false positive.',
  },
};
