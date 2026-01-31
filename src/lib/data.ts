export type ScanResult = {
  id: string;
  host: string;
  port: number;
  service: string;
  version: string;
  status: 'Open' | 'Closed' | 'Filtered';
  knownVulnerabilities: string;
  targetEnvironment: string;
};

export const scanResults: ScanResult[] = [
  {
    id: '1',
    host: '192.168.1.101',
    port: 80,
    service: 'Apache HTTP Server',
    version: '2.4.41',
    status: 'Open',
    knownVulnerabilities: 'CVE-2021-41773 (Path Traversal), CVE-2021-42013 (Path Traversal)',
    targetEnvironment: 'Debian 10, x86_64 architecture, running in a firewalled DMZ.'
  },
  {
    id: '2',
    host: '192.168.1.102',
    port: 22,
    service: 'OpenSSH',
    version: '8.2p1',
    status: 'Open',
    knownVulnerabilities: 'No critical CVEs, but weak ciphers might be enabled.',
    targetEnvironment: 'Ubuntu 20.04 LTS, x86_64, internal server.'
  },
  {
    id: '3',
    host: '192.168.1.103',
    port: 445,
    service: 'Microsoft-DS (Samba)',
    version: '4.11.6',
    status: 'Open',
    knownVulnerabilities: 'CVE-2020-1472 (Zerologon)',
    targetEnvironment: 'Windows Server 2019, part of an Active Directory domain.'
  },
  {
    id: '4',
    host: '192.168.1.104',
    port: 5432,
    service: 'PostgreSQL',
    version: '12.3',
    status: 'Open',
    knownVulnerabilities: 'Potential for SQL injection if queries are not parameterized.',
    targetEnvironment: 'CentOS 8, running in a Docker container.'
  },
];

export type CrawlResult = {
  id: string;
  url: string;
  statusCode: number;
  title: string;
};

export const crawlResults: CrawlResult[] = [
    { id: '1', url: '/login.php', statusCode: 200, title: 'Login Page' },
    { id: '2', url: '/admin', statusCode: 403, title: 'Forbidden' },
    { id: '3', url: '/dashboard', statusCode: 302, title: 'Redirect' },
    { id: '4', url: '/.git/config', statusCode: 200, title: 'Git Config' },
    { id: '5', url: '/robots.txt', statusCode: 200, title: 'Robots.txt' },
];

export type FoundCredential = {
    id: string;
    source: string;
    type: string;
    value: string;
}

export const foundCredentials: FoundCredential[] = [
    { id: '1', source: '/.git/config', type: 'API Key', value: 'AKIAIOSFODNN7EXAMPLE' },
    { id: '2', source: 'comment in index.html', type: 'Password', value: 'admin123!' },
];


export type Report = {
  id: string;
  title: string;
  date: string;
  summary: string;
};

export const reports: Report[] = [
  {
    id: '1',
    title: 'Q2 2024 Internal Network Scan',
    date: '2024-06-15',
    summary: 'Identified 3 critical and 5 high-severity vulnerabilities. Focus on patching Samba and Apache servers.',
  },
  {
    id: '2',
    title: 'Public Web Server Audit',
    date: '2024-05-20',
    summary: 'Found path traversal vulnerability on webserver-01. Immediate patching is required.',
  },
  {
    id: '3',
    title: 'Q1 2024 Compliance Check',
    date: '2024-03-10',
    summary: 'All systems compliant. Minor recommendations for cipher suite updates on SSH servers.',
  },
];
