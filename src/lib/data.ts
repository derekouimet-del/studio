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
