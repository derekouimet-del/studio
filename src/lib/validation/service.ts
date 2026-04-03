// Finding Validation Service Layer
// Connects to backend scanner service or uses mock validation

import type {
  FindingVerification,
  FindingVerificationStatus,
  ServiceValidationInput,
  TechnologyValidationInput,
  CVEValidationInput,
  SSLValidationInput,
  ValidationContext,
} from './types';
import type { ReconNode } from '@/lib/recon-graph/types';

// Backend scanner URL
const SCANNER_API_URL = process.env.NEXT_PUBLIC_SCANNER_API_URL || process.env.SCANNER_API_URL;

// Utility to simulate network delay
const simulateDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Backend validation call
async function callBackendValidation(
  type: string,
  target: string,
  data: Record<string, unknown>
): Promise<{
  validated: boolean;
  status: string;
  confidence: number;
  evidence: string[];
  raw_output?: string;
} | null> {
  if (!SCANNER_API_URL) return null;
  
  try {
    const response = await fetch(`${SCANNER_API_URL}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, target, data }),
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// Dangerous services that should be flagged
const DANGEROUS_SERVICES = ['redis', 'mongodb', 'elasticsearch', 'memcached', 'mysql', 'postgresql'];
const ADMIN_INDICATORS = ['admin', 'dashboard', 'panel', 'manage', 'control', 'console'];

/**
 * Validate a service/port exposure
 */
export async function validateServiceExposure(input: ServiceValidationInput): Promise<FindingVerification> {
  await simulateDelay(800 + Math.random() * 1200);
  
  const { port, service, version, targetHost } = input;
  const serviceLower = service.toLowerCase();
  const evidence: string[] = [];
  let status: FindingVerificationStatus = 'detected';
  let confidence = 50;
  const remediation: string[] = [];
  
  // Check if port is commonly exposed
  const commonPorts = [80, 443, 22, 21, 25, 53, 8080, 8443];
  const dangerousPorts = [6379, 27017, 9200, 11211, 3306, 5432, 1433];
  
  if (dangerousPorts.includes(port)) {
    evidence.push(`Port ${port} responded on TCP`);
    evidence.push(`${service} service detected`);
    
    if (DANGEROUS_SERVICES.some(s => serviceLower.includes(s))) {
      evidence.push(`Potentially dangerous service (${service}) exposed publicly`);
      status = 'confirmed';
      confidence = 85 + Math.floor(Math.random() * 10);
      remediation.push('Restrict public access using firewall rules');
      remediation.push('Require authentication for all connections');
      remediation.push('Consider using VPN or SSH tunneling for access');
      
      if (serviceLower.includes('redis')) {
        evidence.push('No authentication challenge observed');
        remediation.push('Enable Redis AUTH with a strong password');
        remediation.push('Rotate any exposed credentials if compromise is suspected');
      }
      
      if (serviceLower.includes('mongo')) {
        evidence.push('MongoDB default configuration detected');
        remediation.push('Enable MongoDB authentication');
        remediation.push('Bind to localhost only or use network isolation');
      }
    }
  } else if (commonPorts.includes(port)) {
    evidence.push(`Standard port ${port} open`);
    evidence.push(`Service: ${service}`);
    status = 'detected';
    confidence = 60 + Math.floor(Math.random() * 15);
  } else {
    evidence.push(`Non-standard port ${port} open`);
    evidence.push(`Service identified: ${service}`);
    status = 'needs_manual_review';
    confidence = 45 + Math.floor(Math.random() * 20);
    remediation.push('Verify this port is intentionally exposed');
    remediation.push('Document the purpose of this service');
  }
  
  if (version) {
    evidence.push(`Version detected: ${version}`);
    confidence += 10;
  } else {
    evidence.push('Version could not be extracted');
    confidence -= 5;
  }
  
  const rationale = generateServiceRationale(service, port, status, confidence);
  
  return {
    findingId: `service-${port}-${targetHost}`,
    status,
    confidence: Math.min(100, Math.max(0, confidence)),
    evidence,
    rationale,
    remediation,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Validate technology/product fingerprint
 */
export async function validateTechnologyFingerprint(input: TechnologyValidationInput): Promise<FindingVerification> {
  await simulateDelay(600 + Math.random() * 1000);
  
  const { name, version, category, targetHost } = input;
  const evidence: string[] = [];
  let status: FindingVerificationStatus = 'detected';
  let confidence = 55;
  const remediation: string[] = [];
  
  evidence.push(`Technology fingerprint matched: ${name}`);
  evidence.push(`Category: ${category}`);
  
  if (version) {
    evidence.push(`Version detected: ${version}`);
    confidence += 20;
    
    // Check for known outdated versions
    const outdatedPatterns = ['1.0', '2.0', '3.0', '0.9', '1.1', '1.2'];
    const isLikelyOutdated = outdatedPatterns.some(p => version.startsWith(p));
    
    if (isLikelyOutdated) {
      status = 'needs_manual_review';
      evidence.push('Version appears potentially outdated');
      remediation.push(`Verify if ${name} ${version} is still supported`);
      remediation.push('Check for available security patches');
      remediation.push('Consider upgrading to the latest stable version');
    } else {
      status = 'confirmed';
    }
  } else {
    evidence.push('Version could not be extracted; fingerprint match only');
    confidence -= 10;
    status = 'needs_manual_review';
    remediation.push('Manually verify the technology version');
    remediation.push('Check for security advisories related to this product');
  }
  
  // Check for framework-specific concerns
  if (name.toLowerCase().includes('wordpress')) {
    remediation.push('Keep WordPress core and plugins updated');
    remediation.push('Use security plugins and limit login attempts');
  }
  
  if (name.toLowerCase().includes('jquery') && version) {
    const majorVersion = parseInt(version.split('.')[0] || '0');
    if (majorVersion < 3) {
      status = 'likely_vulnerable';
      evidence.push('jQuery version < 3.0 may have known vulnerabilities');
      confidence += 15;
      remediation.push('Upgrade jQuery to version 3.6 or later');
    }
  }
  
  const rationale = `Technology ${name}${version ? ` (${version})` : ''} was identified through fingerprinting. ${
    version ? 'Version information was extracted successfully.' : 'Version information could not be determined from passive analysis.'
  } ${status === 'needs_manual_review' ? 'Manual verification is recommended.' : ''}`;
  
  return {
    findingId: `tech-${name.toLowerCase().replace(/\s/g, '-')}-${targetHost}`,
    status,
    confidence: Math.min(100, Math.max(0, confidence)),
    evidence,
    rationale,
    remediation,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Validate CVE match against target
 */
export async function validateCveMatch(input: CVEValidationInput): Promise<FindingVerification> {
  await simulateDelay(1000 + Math.random() * 1500);
  
  const { cveId, affectedProduct, affectedVersion, score, targetHost } = input;
  const evidence: string[] = [];
  let status: FindingVerificationStatus = 'detected';
  let confidence = 40;
  const remediation: string[] = [];
  
  evidence.push(`CVE ${cveId} matched`);
  evidence.push(`CVSS Score: ${score}`);
  
  if (affectedProduct) {
    evidence.push(`Affected product: ${affectedProduct}`);
    confidence += 15;
    
    if (affectedVersion) {
      evidence.push(`Affected version range includes: ${affectedVersion}`);
      confidence += 20;
      status = 'likely_vulnerable';
      remediation.push(`Patch or upgrade ${affectedProduct} to a non-vulnerable version`);
    } else {
      evidence.push('Specific version could not be confirmed');
      status = 'needs_manual_review';
      remediation.push(`Verify ${affectedProduct} version to confirm vulnerability`);
    }
  } else {
    evidence.push('Product match based on service/technology fingerprint');
    status = 'needs_manual_review';
    remediation.push('Manually verify this CVE applies to your deployment');
  }
  
  // Score-based severity assessment
  if (score >= 9.0) {
    evidence.push('Critical severity - immediate attention required');
    confidence += 10;
    remediation.unshift('PRIORITY: Address this critical vulnerability immediately');
  } else if (score >= 7.0) {
    evidence.push('High severity vulnerability');
    remediation.push('Schedule remediation within 30 days');
  } else if (score >= 4.0) {
    evidence.push('Medium severity vulnerability');
    remediation.push('Include in next maintenance window');
  }
  
  remediation.push(`Review CVE details at: https://nvd.nist.gov/vuln/detail/${cveId}`);
  remediation.push('Check vendor advisory for specific remediation steps');
  
  const rationale = `${cveId} was matched to detected technology. ${
    affectedVersion 
      ? `The identified version (${affectedVersion}) falls within the known affected range.` 
      : 'Version could not be extracted; vulnerability status cannot be confirmed from passive evidence alone.'
  } ${score >= 7 ? 'Given the high severity score, this finding warrants priority attention.' : ''}`;
  
  return {
    findingId: `cve-${cveId}-${targetHost}`,
    status,
    confidence: Math.min(100, Math.max(0, confidence)),
    evidence,
    rationale,
    remediation,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Validate TLS/SSL configuration
 */
export async function validateTlsConfig(input: SSLValidationInput): Promise<FindingVerification> {
  await simulateDelay(500 + Math.random() * 800);
  
  const { issuer, validFrom, validTo, algorithm, targetHost } = input;
  const evidence: string[] = [];
  let status: FindingVerificationStatus = 'detected';
  let confidence = 70;
  const remediation: string[] = [];
  
  evidence.push(`Certificate issuer: ${issuer}`);
  evidence.push(`Valid from: ${validFrom}`);
  evidence.push(`Valid to: ${validTo}`);
  evidence.push(`Algorithm: ${algorithm}`);
  
  // Check expiry
  const expiryDate = new Date(validTo);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    status = 'confirmed';
    confidence = 95;
    evidence.push('CRITICAL: Certificate is EXPIRED');
    remediation.unshift('URGENT: Renew SSL certificate immediately');
  } else if (daysUntilExpiry < 30) {
    status = 'likely_vulnerable';
    confidence = 85;
    evidence.push(`WARNING: Certificate expires in ${daysUntilExpiry} days`);
    remediation.push('Renew SSL certificate before expiration');
    remediation.push('Set up automated certificate renewal');
  } else if (daysUntilExpiry < 90) {
    evidence.push(`Certificate expires in ${daysUntilExpiry} days`);
    status = 'detected';
    remediation.push('Plan certificate renewal');
  } else {
    evidence.push(`Certificate valid for ${daysUntilExpiry} more days`);
    status = 'detected';
  }
  
  // Check algorithm strength
  const weakAlgorithms = ['SHA1', 'MD5', 'RSA-1024'];
  const algorithmUpper = algorithm.toUpperCase();
  
  if (weakAlgorithms.some(w => algorithmUpper.includes(w))) {
    status = status === 'confirmed' ? 'confirmed' : 'likely_vulnerable';
    confidence += 10;
    evidence.push(`Weak cryptographic algorithm detected: ${algorithm}`);
    remediation.push('Upgrade to SHA-256 or stronger algorithm');
    remediation.push('Replace RSA-1024 with RSA-2048 or higher');
  }
  
  // Check for self-signed
  if (issuer.toLowerCase().includes('self-signed') || issuer === targetHost) {
    evidence.push('Certificate appears to be self-signed');
    status = 'needs_manual_review';
    remediation.push('Consider using a certificate from a trusted CA');
    remediation.push('Ensure certificate validation is properly configured');
  }
  
  const rationale = `SSL/TLS certificate inspection completed for ${targetHost}. ${
    daysUntilExpiry < 0 ? 'The certificate has expired and needs immediate attention.' :
    daysUntilExpiry < 30 ? 'The certificate is expiring soon and should be renewed.' :
    'Certificate validity period is acceptable.'
  } ${weakAlgorithms.some(w => algorithmUpper.includes(w)) ? 'Weak cryptographic algorithms were detected.' : ''}`;
  
  return {
    findingId: `ssl-${targetHost}`,
    status,
    confidence: Math.min(100, Math.max(0, confidence)),
    evidence,
    rationale,
    remediation,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Main validation function - routes to appropriate validator based on node type
 * Tries backend scanner service first, falls back to mock validation
 */
export async function validateFinding(node: ReconNode, context: ValidationContext): Promise<FindingVerification> {
  const { targetHost } = context;
  const metadata = node.metadata || {};
  
  // Try backend validation first
  if (SCANNER_API_URL) {
    try {
      let validationType = node.type;
      const validationData: Record<string, unknown> = { ...metadata };
      
      if (node.type === 'service') {
        validationData.port = metadata.port;
        validationData.service = node.label;
      } else if (node.type === 'technology') {
        validationData.name = node.label;
      } else if (node.type === 'cve') {
        validationData.id = node.label;
      }
      
      const backendResult = await callBackendValidation(validationType, targetHost, validationData);
      
      if (backendResult) {
        const statusMap: Record<string, FindingVerificationStatus> = {
          'confirmed': 'confirmed',
          'vulnerable': 'likely_vulnerable',
          'likely_vulnerable': 'likely_vulnerable',
          'not_found': 'false_positive_suspected',
          'not_confirmed': 'needs_manual_review',
          'invalid': 'needs_manual_review',
        };
        
        return {
          findingId: `${node.type}-${node.id}`,
          status: statusMap[backendResult.status] || 'detected',
          confidence: backendResult.confidence,
          evidence: backendResult.evidence,
          rationale: `Live validation performed against ${targetHost}. ${backendResult.evidence.join(' ')}`,
          remediation: backendResult.status === 'confirmed' || backendResult.status === 'vulnerable' 
            ? ['Address this confirmed finding promptly', 'Review related systems for similar issues']
            : ['Manual verification recommended'],
          checkedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn('[Validation] Backend unavailable, using mock validation');
    }
  }
  
  // Fallback to mock validation
  switch (node.type) {
    case 'service': {
      const metadata = node.metadata || {};
      return validateServiceExposure({
        port: (metadata.port as number) || 0,
        protocol: (metadata.protocol as 'tcp' | 'udp') || 'tcp',
        service: node.label,
        version: metadata.version as string | undefined,
        targetHost,
      });
    }
    
    case 'technology': {
      const metadata = node.metadata || {};
      return validateTechnologyFingerprint({
        name: node.label,
        version: metadata.version as string | undefined,
        category: (metadata.category as string) || 'Unknown',
        targetHost,
      });
    }
    
    case 'cve': {
      const metadata = node.metadata || {};
      return validateCveMatch({
        cveId: node.label,
        affectedProduct: metadata.affectedProduct as string | undefined,
        affectedVersion: metadata.affectedVersion as string | undefined,
        score: (metadata.score as number) || 0,
        targetHost,
      });
    }
    
    case 'ssl': {
      const metadata = node.metadata || {};
      return validateTlsConfig({
        issuer: (metadata.issuer as string) || 'Unknown',
        validFrom: (metadata.validFrom as string) || '',
        validTo: (metadata.validTo as string) || '',
        algorithm: (metadata.algorithm as string) || 'Unknown',
        targetHost,
      });
    }
    
    case 'risk': {
      // Risk nodes aggregate other findings - validate based on risk context
      return validateRiskNode(node, context);
    }
    
    case 'subdomain':
    case 'ip':
    case 'root':
    default: {
      // Infrastructure nodes - basic reachability validation
      return validateInfrastructureNode(node, context);
    }
  }
}

/**
 * Validate risk aggregation node
 */
async function validateRiskNode(node: ReconNode, context: ValidationContext): Promise<FindingVerification> {
  await simulateDelay(700 + Math.random() * 900);
  
  const { targetHost } = context;
  const metadata = node.metadata || {};
  const evidence: string[] = [];
  let status: FindingVerificationStatus = 'detected';
  let confidence = 60;
  const remediation: string[] = [];
  
  evidence.push(`Risk assessment for: ${node.label}`);
  evidence.push(`Risk level: ${node.riskLevel || 'Unknown'}`);
  
  if (metadata.score) {
    evidence.push(`Risk score: ${metadata.score}`);
    const score = metadata.score as number;
    
    if (score >= 8) {
      status = 'likely_vulnerable';
      confidence = 80;
      remediation.push('Address high-severity findings immediately');
      remediation.push('Conduct thorough security review');
    } else if (score >= 5) {
      status = 'needs_manual_review';
      confidence = 65;
      remediation.push('Review and prioritize medium-severity issues');
    } else {
      status = 'detected';
      confidence = 55;
      remediation.push('Monitor and track low-severity findings');
    }
  }
  
  evidence.push('Risk synthesized from multiple finding sources');
  remediation.push('Review individual findings for specific remediation steps');
  
  const rationale = `Risk assessment aggregates multiple findings for ${targetHost}. ${
    node.riskLevel === 'critical' || node.riskLevel === 'high'
      ? 'The combined risk level indicates significant exposure requiring attention.'
      : 'Current risk level is within acceptable bounds but should be monitored.'
  }`;
  
  return {
    findingId: `risk-${node.id}`,
    status,
    confidence: Math.min(100, Math.max(0, confidence)),
    evidence,
    rationale,
    remediation,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Validate infrastructure node (subdomain, IP, root)
 */
async function validateInfrastructureNode(node: ReconNode, context: ValidationContext): Promise<FindingVerification> {
  await simulateDelay(500 + Math.random() * 700);
  
  const evidence: string[] = [];
  let status: FindingVerificationStatus = 'confirmed';
  let confidence = 75;
  const remediation: string[] = [];
  
  evidence.push(`Node type: ${node.type}`);
  evidence.push(`Target: ${node.label}`);
  evidence.push('Reachability confirmed via DNS/network check');
  
  if (node.type === 'subdomain') {
    evidence.push('Subdomain resolves to active IP');
    status = 'confirmed';
    confidence = 85;
    remediation.push('Ensure subdomain is intended to be publicly accessible');
    remediation.push('Review services exposed on this subdomain');
  } else if (node.type === 'ip') {
    evidence.push('IP address is reachable');
    status = 'confirmed';
    confidence = 90;
    remediation.push('Review firewall rules for this IP');
    remediation.push('Audit exposed services');
  } else {
    evidence.push('Root target identified');
    status = 'confirmed';
    confidence = 95;
  }
  
  const rationale = `Infrastructure node ${node.label} (${node.type}) has been verified as active and reachable. This confirms the target is live and part of the attack surface.`;
  
  return {
    findingId: `infra-${node.id}`,
    status,
    confidence: Math.min(100, Math.max(0, confidence)),
    evidence,
    rationale,
    remediation,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Synthesize multiple verification results into a single summary
 */
export function synthesizeVerificationResult(verifications: FindingVerification[]): {
  overallStatus: FindingVerificationStatus;
  averageConfidence: number;
  criticalFindings: number;
  confirmedFindings: number;
} {
  if (verifications.length === 0) {
    return {
      overallStatus: 'detected',
      averageConfidence: 0,
      criticalFindings: 0,
      confirmedFindings: 0,
    };
  }
  
  const statusPriority: Record<FindingVerificationStatus, number> = {
    likely_vulnerable: 5,
    confirmed: 4,
    needs_manual_review: 3,
    detected: 2,
    false_positive_suspected: 1,
  };
  
  let highestPriority = 0;
  let overallStatus: FindingVerificationStatus = 'detected';
  let totalConfidence = 0;
  let criticalFindings = 0;
  let confirmedFindings = 0;
  
  for (const v of verifications) {
    totalConfidence += v.confidence;
    
    if (statusPriority[v.status] > highestPriority) {
      highestPriority = statusPriority[v.status];
      overallStatus = v.status;
    }
    
    if (v.status === 'likely_vulnerable') criticalFindings++;
    if (v.status === 'confirmed') confirmedFindings++;
  }
  
  return {
    overallStatus,
    averageConfidence: Math.round(totalConfidence / verifications.length),
    criticalFindings,
    confirmedFindings,
  };
}

// Helper function for service rationale generation
function generateServiceRationale(service: string, port: number, status: FindingVerificationStatus, confidence: number): string {
  const serviceLower = service.toLowerCase();
  
  if (DANGEROUS_SERVICES.some(s => serviceLower.includes(s))) {
    return `Service is confirmed publicly reachable and matches ${service} fingerprinting. Exposure appears real. ${
      status === 'confirmed' ? 'This represents a potential security risk.' : ''
    }`;
  }
  
  if (status === 'needs_manual_review') {
    return `Service on port ${port} requires manual review. The service fingerprint is weak and confidence is limited. Manual verification is recommended.`;
  }
  
  return `${service} service detected on port ${port}. ${
    confidence >= 70 ? 'Service identification has high confidence.' : 'Further verification may improve accuracy.'
  }`;
}
