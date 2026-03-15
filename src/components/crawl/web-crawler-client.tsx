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
import { Bot, LoaderCircle, ShieldAlert, Link as LinkIcon, Clipboard } from 'lucide-react';
import { crawlWebsiteAction } from '@/app/actions';
import type { CrawlWebsiteOutput } from '@/ai/flows/web-crawler';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CrawlResult = CrawlWebsiteOutput['pages'][0];
type FoundCredential = CrawlWebsiteOutput['credentials'][0];

export function WebCrawlerClient() {
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [isCrawling, setIsCrawling] = useState(false);
  const [pages, setPages] = useState<CrawlResult[]>([]);
  const [credentials, setCredentials] = useState<FoundCredential[]>([]);
  const { toast } = useToast();

  const handleCrawl = async () => {
    setIsCrawling(true);
    setPages([]);
    setCredentials([]);

    const response = await crawlWebsiteAction({ targetUrl });

    if (response.success && response.data) {
      setPages(response.data.pages || []);
      setCredentials(response.data.credentials || []);
      if (response.data.credentials.length > 0) {
        toast({
          title: 'Deep Crawl Findings',
          description: `Found ${response.data.credentials.length} potential secrets during crawl.`,
          variant: response.data.credentials.some(c => c.severity === 'critical') ? 'destructive' : 'default'
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Crawl Failed',
        description: response.error,
      });
    }

    setIsCrawling(false);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const getStatusBadgeVariant = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "default";
    if (statusCode >= 400) return "destructive";
    if (statusCode >= 300) return "secondary";
    return "outline";
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="bg-red-700 animate-pulse">CRITICAL</Badge>;
      case 'high': return <Badge variant="destructive">HIGH</Badge>;
      case 'medium': return <Badge className="bg-yellow-600">MEDIUM</Badge>;
      case 'low': return <Badge variant="secondary">LOW</Badge>;
      case 'info': return <Badge variant="outline">INFO</Badge>;
      default: return null;
    }
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Intelligent Web Crawler</CardTitle>
          <CardDescription>
            Analyzes web pages for structural links and uses a rule-based engine to identify high-risk credentials. AWS leaks are now validated as pairs for critical reporting.
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
              onKeyDown={(e) => e.key === 'Enter' && !isCrawling && handleCrawl()}
            />
            <Button onClick={handleCrawl} disabled={isCrawling}>
              {isCrawling ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Bot />
              )}
              <span>{isCrawling ? 'Analyzing...' : 'Analyze Site'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isCrawling && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Performing Deep Crawl...</h3>
            <p className="text-muted-foreground">Running classification rules and AI discovery on site content.</p>
        </div>
      )}

      {(pages.length > 0 || credentials.length > 0) && !isCrawling && (
        <div className="grid lg:grid-cols-2 gap-8">
            <Card className={cn(credentials.some(c => c.severity === 'critical' || c.severity === 'high') && "border-destructive/50")}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className={cn(credentials.length > 0 ? "text-destructive" : "text-muted-foreground")} /> 
                      Security Findings
                    </CardTitle>
                    <CardDescription>Detected {credentials.length} secrets. Showing full values for verification.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Severity</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {credentials.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                  No secrets detected on this page.
                                </TableCell>
                              </TableRow>
                            ) : (
                              credentials.map(cred => (
                                <TableRow key={cred.id} className={cn(cred.severity === 'critical' && "bg-destructive/5")}>
                                    <TableCell>{getSeverityBadge(cred.severity)}</TableCell>
                                    <TableCell className="font-medium text-xs">{cred.type}</TableCell>
                                    <TableCell className="font-code text-[10px] break-all max-w-[150px]">{cred.value}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cred.value)}>
                                            <Clipboard className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                              ))
                            )}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon /> Discovered Infrastructure</CardTitle>
                    <CardDescription>Identified {pages.length} potential entry points or linked assets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset URL</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pages.map(page => (
                                    <TableRow key={page.id}>
                                        <TableCell className="font-code text-xs max-w-[200px] truncate" title={page.url}>{page.url}</TableCell>
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
