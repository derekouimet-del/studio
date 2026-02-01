'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { FileSearch, ExternalLink } from 'lucide-react';

const dorkCategories = [
  {
    category: 'Logins',
    dorks: [
      { title: 'Find Login Pages', template: 'site:{target} intitle:"login" | inurl:login' },
      { title: 'Find Admin Portals', template: 'site:{target} intitle:"admin" | inurl:admin' },
    ],
  },
  {
    category: 'Exposed Docs',
    dorks: [
      { title: 'Find PDF files', template: 'site:{target} filetype:pdf' },
      { title: 'Find Word documents', template: 'site:{target} filetype:docx' },
      { title: 'Find Excel sheets', template: 'site:{target} filetype:xlsx' },
      { title: 'Find PowerPoint presentations', template: 'site:{target} filetype:pptx' },
    ],
  },
  {
    category: 'Exposed Configs',
    dorks: [
      { title: 'Find .env files', template: 'site:{target} intext:"DB_PASSWORD" filetype:env' },
      { title: 'Find .config files', template: 'site:{target} filetype:config' },
      { title: 'Find log files', template: 'site:{target} filetype:log' },
    ],
  },
  {
    category: 'Directory Listings',
    dorks: [
      { title: 'Find open directories', template: 'site:{target} intitle:"index of"' },
    ],
  },
  {
    category: 'Vulnerabilities',
    dorks: [
      { title: 'Find SQL errors', template: 'site:{target} intext:"sql syntax near" | intext:"syntax error has occurred"' },
      { title: 'Find PHP errors', template: 'site:{target} "PHP Error" | "PHP Warning"' },
    ],
  },
];

type GeneratedDork = {
  title: string;
  query: string;
  url: string;
};

export function GoogleReconClient() {
  const [target, setTarget] = useState('');
  const [generatedDorks, setGeneratedDorks] = useState<GeneratedDork[]>([]);

  const handleGenerate = () => {
    if (!target) {
      setGeneratedDorks([]);
      return;
    }

    const allDorks: GeneratedDork[] = [];
    dorkCategories.forEach(category => {
      category.dorks.forEach(dork => {
        const query = dork.template.replace(/{target}/g, target);
        allDorks.push({
          title: dork.title,
          query: query,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        });
      });
    });

    setGeneratedDorks(allDorks);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Google Recon</CardTitle>
          <CardDescription>
            Automatically generate a list of Google Dorks for a specific target to uncover potential vulnerabilities and exposed information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., example.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button onClick={handleGenerate} disabled={!target}>
              <FileSearch />
              <span>Generate Dorks</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedDorks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Dorks for "{target}"</CardTitle>
            <CardDescription>
              Click a link to perform the search on Google. Results will open in a new tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Dork Query</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedDorks.map((dork, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dork.title}</TableCell>
                    <TableCell className="font-code text-muted-foreground">{dork.query}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={dork.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink /> Search
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
