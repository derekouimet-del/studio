'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, LoaderCircle, Search, Copy, Check, ExternalLink, Play, FileJson, FileSpreadsheet, ChevronDown, ChevronUp, Globe, Server, MapPin, CheckCircle2 } from 'lucide-react';
import { shodanSuggestionAction } from '@/app/actions';
import { ChatBubble } from '@/components/agent/chat-bubble';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useRecordActivity } from '@/lib/activity';

interface ShodanSearchResult {
  ip: string;
  port: string;
  transport: string;
  hostnames: string;
  domain: string;
  org: string;
  isp: string;
  os: string;
  product: string;
  version: string;
  country: string;
  country_name: string;
  city: string;
  title: string;
  banner?: string;
  timestamp: string;
}

interface ShodanSearchData {
  total: number;
  page: number;
  results: ShodanSearchResult[];
  query: string;
}

type Message = {
  role: 'user' | 'model';
  content: string;
  query?: string | null;
  searchResults?: ShodanSearchData | null;
  isSearching?: boolean;
};

export function ShodanForgeClient() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content:
        "Hi! I'm Sentinel, your Shodan query expert. I can translate your search intent into precise Shodan filter syntax and **execute searches directly** using your API key.\n\n**Try asking things like:**\n- \"Find exposed RDP servers in Germany\"\n- \"Search for nginx web servers with a login page in the US\"\n- \"Find Redis databases on port 6379\"\n- \"Look for Jenkins dashboards\"\n- \"Find MongoDB instances in the 10.0.0.0/8 range\"\n\nOnce I generate a query, you can **Run Search** to fetch results directly, then **download as JSON or CSV**.\n\nWhat would you like to search for?",
    },
  ]);
  const { toast } = useToast();
  const { record: recordActivity } = useRecordActivity('shodan');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForAI = messages.map((m) => ({ role: m.role, content: m.content }));

    const response = await shodanSuggestionAction({
      history: historyForAI,
      message: input,
    });

    if (response.success && response.data) {
      const modelMessage: Message = {
        role: 'model',
        content: response.data.response,
        query: response.data.query,
      };
      setMessages((prev) => [...prev, modelMessage]);

      if (response.data.query) {
        recordActivity({
          target: input.slice(0, 50),
          summary: response.data.query.slice(0, 40) + '...',
        });
      }
    } else {
      const errorMessage: Message = {
        role: 'model',
        content: "I'm sorry, I'm having trouble connecting to the logic core. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const copyToClipboard = (query: string) => {
    navigator.clipboard.writeText(query);
    setHasCopied(query);
    toast({ title: 'Query copied to clipboard' });
    setTimeout(() => setHasCopied(null), 2000);
  };

  const executeSearch = async (query: string, messageIndex: number) => {
    setMessages((prev) =>
      prev.map((msg, idx) => (idx === messageIndex ? { ...msg, isSearching: true } : msg))
    );

    try {
      const response = await fetch('/api/shodan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex ? { ...msg, isSearching: false, searchResults: result.data } : msg
          )
        );
        setExpandedResults((prev) => new Set(prev).add(messageIndex));
        toast({
          title: 'Search completed',
          description: `Found ${result.data.total.toLocaleString()} results`,
        });
      } else {
        toast({
          title: 'Search failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive',
        });
        setMessages((prev) =>
          prev.map((msg, idx) => (idx === messageIndex ? { ...msg, isSearching: false } : msg))
        );
      }
    } catch (error) {
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Network error',
        variant: 'destructive',
      });
      setMessages((prev) =>
        prev.map((msg, idx) => (idx === messageIndex ? { ...msg, isSearching: false } : msg))
      );
    }
  };

  const downloadResults = async (results: ShodanSearchResult[], format: 'json' | 'csv') => {
    const filename = `shodan-results-${Date.now()}.${format}`;

    try {
      const response = await fetch('/api/shodan/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, format, filename }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      setDownloadedFile(filename);
      toast({
        title: 'Download started',
        description: `${filename} (${results.length} results) - Check your Downloads folder`,
      });
      setTimeout(() => setDownloadedFile(null), 5000);
    } catch (error) {
      console.error('[v0] Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download results. Try copying from the table instead.',
        variant: 'destructive',
      });
    }
  };

  const toggleResults = (index: number) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Card className="flex flex-col h-[75vh]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="text-primary" /> ShodanForge Query Builder
        </CardTitle>
        <CardDescription>
          Sentinel translates natural language into precise Shodan queries. Describe what you want to find and get
          syntactically correct queries ready to execute.
        </CardDescription>
        {downloadedFile && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-3 py-2 rounded-md">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Downloaded: <strong>{downloadedFile}</strong> - Check your Downloads folder
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-6 pb-4">
          <div className="space-y-6 pr-4 py-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-3">
                <ChatBubble role={message.role} content={message.content} />
                {message.role === 'model' && message.query && (
                  <div className="ml-12 flex flex-col gap-3">
                    <div className="bg-card p-4 rounded-md font-code text-sm border relative group overflow-x-auto">
                      <pre>
                        <code>{message.query}</code>
                      </pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => copyToClipboard(message.query!)}
                      >
                        {hasCopied === message.query ? (
                          <Check className="text-green-500 h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => executeSearch(message.query!, index)}
                        disabled={message.isSearching}
                      >
                        {message.isSearching ? (
                          <>
                            <LoaderCircle className="h-3 w-3 mr-1 animate-spin" /> Searching...
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" /> Run Search
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" asChild className="text-xs h-7">
                        <a
                          href={`https://www.shodan.io/search?query=${encodeURIComponent(message.query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> View on Shodan
                        </a>
                      </Button>
                      {message.searchResults && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => downloadResults(message.searchResults!.results, 'json')}
                          >
                            <FileJson className="h-3 w-3 mr-1" /> JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => downloadResults(message.searchResults!.results, 'csv')}
                          >
                            <FileSpreadsheet className="h-3 w-3 mr-1" /> CSV
                          </Button>
                        </>
                      )}
                    </div>

                    {message.searchResults && (
                      <Collapsible
                        open={expandedResults.has(index)}
                        onOpenChange={() => toggleResults(index)}
                        className="border rounded-md"
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono">
                                {message.searchResults.total.toLocaleString()} total
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Showing {message.searchResults.results.length} results
                              </span>
                            </div>
                            {expandedResults.has(index) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t max-h-96 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[160px]">IP:Port</TableHead>
                                  <TableHead>Hostnames</TableHead>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Org</TableHead>
                                  <TableHead>Location</TableHead>
                                  <TableHead className="w-[200px]">Title</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {message.searchResults.results.map((result, rIdx) => (
                                  <TableRow key={rIdx}>
                                    <TableCell className="font-mono text-xs">
                                      <a
                                        href={`https://www.shodan.io/host/${result.ip}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Globe className="h-3 w-3" />
                                        {result.ip}:{result.port}
                                      </a>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs max-w-[180px] truncate" title={result.hostnames}>
                                      {result.hostnames || '-'}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div className="flex items-center gap-1">
                                        <Server className="h-3 w-3 text-muted-foreground" />
                                        {[result.product, result.version].filter(Boolean).join(' ') || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs max-w-[140px] truncate" title={result.org}>
                                      {result.org || '-'}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        {result.country_name || result.country || '-'}
                                        {result.city && `, ${result.city}`}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs max-w-[200px] truncate" title={result.title}>
                                      {result.title || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted ml-12">
                  <LoaderCircle className="animate-spin size-4" />
                  <span className="text-sm text-muted-foreground">Sentinel is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-2 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="e.g., find exposed RDP servers in Germany"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading}>
              <Send />
              <span className="sr-only">Send Message</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
