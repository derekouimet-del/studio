'use client';

import { useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, LoaderCircle, KeyRound, FileCode, Link as LinkIcon } from 'lucide-react';
import { crawlResults, foundCredentials, type CrawlResult, type FoundCredential } from '@/lib/data';

export function WebCrawlerClient() {
  const [targetUrl, setTargetUrl] = useState('http://example.com');
  const [isCrawling, setIsCrawling] = useState(false);
  const [pages, setPages] = useState<CrawlResult[]>([]);
  const [credentials, setCredentials] = useState<FoundCredential[]>([]);

  const handleCrawl = () => {
    setIsCrawling(true);
    setPages([]);
    setCredentials([]);
    setTimeout(() => {
      setPages(crawlResults);
      setCredentials(foundCredentials);
      setIsCrawling(false);
    }, 2500);
  };
  
    const getStatusBadgeVariant = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 400) return "destructive";
    if (statusCode >= 300) return "secondary";
    return "outline";
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Crawl Website</CardTitle>
          <CardDescription>
            Enter a URL to crawl its pages and look for exposed credentials or sensitive files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isCrawling}
            />
            <Button onClick={handleCrawl} disabled={isCrawling}>
              {isCrawling ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Bot />
              )}
              <span>{isCrawling ? 'Crawling...' : 'Crawl'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isCrawling && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Crawling website...</h3>
            <p className="text-muted-foreground">Discovering pages and searching for secrets.</p>
        </div>
      )}

      {(pages.length > 0 || credentials.length > 0) && !isCrawling && (
        <div className="grid lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="text-destructive"/> Discovered Credentials</CardTitle>
                    <CardDescription>Found {credentials.length} potential credentials or secrets.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credentials.map(cred => (
                                <TableRow key={cred.id}>
                                    <TableCell><Badge variant="destructive">{cred.type}</Badge></TableCell>
                                    <TableCell className="font-code text-muted-foreground">{cred.source}</TableCell>
                                    <TableCell className="font-code">{cred.value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon /> Discovered Pages</CardTitle>
                    <CardDescription>Found {pages.length} pages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pages.map(page => (
                                    <TableRow key={page.id}>
                                        <TableCell className="font-code">{page.url}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(page.statusCode) as any}>{page.statusCode}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
