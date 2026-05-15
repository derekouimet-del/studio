'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, LoaderCircle, Search, Copy, Check, ExternalLink, Play, Download, FileJson, FileSpreadsheet, ChevronDown, ChevronUp, Globe, Server, MapPin, Building, CheckCircle2 } from 'lucide-react';
import { fofaSuggestionAction } from '@/app/actions';
import { ChatBubble } from '@/components/agent/chat-bubble';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useRecordActivity } from '@/lib/activity';

interface FofaSearchResult {
  host: string;
  ip: string;
  port: string;
  protocol: string;
  country: string;
  country_name: string;
  region: string;
  city: string;
  as_organization: string;
  title: string;
  domain: string;
  server: string;
}

interface FofaSearchData {
  total: number;
  page: number;
  results: FofaSearchResult[];
  query: string;
}

type Message = {
  role: 'user' | 'model';
  content: string;
  query?: string | null;
  searchResults?: FofaSearchData | null;
  isSearching?: boolean;
};

// Helper to base64 encode UTF-8 strings in the browser
function base64Encode(str: string) {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        return btoa(str);
    }
}

export function FofaForgeClient() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
  const [resultSize, setResultSize] = useState<number>(100);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hi! I'm Nexus, your FOFA query expert. I can translate your search intent into precise FOFA syntax and **execute searches directly** using your API credentials.\n\n**Try asking things like:**\n- \"Find exposed Jenkins servers in Germany\"\n- \"Search for login pages with valid SSL certificates\"\n- \"Find Redis databases on port 6379\"\n- \"Look for WordPress sites in the US\"\n- \"Find servers running nginx in the 192.168.1.0/24 range\"\n\nOnce I generate a query, you can **Run Search** to fetch results directly, then **download as JSON or CSV**.\n\nWhat would you like to search for?",
    },
  ]);
  const { toast } = useToast();
  const { record: recordActivity } = useRecordActivity('fofa');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForAI = messages.map(m => ({ role: m.role, content: m.content }));

    const response = await fofaSuggestionAction({
      history: historyForAI,
      message: input,
    });

    if (response.success && response.data) {
      const modelMessage: Message = { 
        role: 'model', 
        content: response.data.response,
        query: response.data.query
      };
      setMessages((prev) => [...prev, modelMessage]);
      
      // Record activity for dashboard if a query was generated
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
    // Update message to show searching state
    setMessages((prev) => 
      prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, isSearching: true } : msg
      )
    );

    try {
      const response = await fetch('/api/fofa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, size: resultSize }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex
              ? { ...msg, isSearching: false, searchResults: result.data }
              : msg
          )
        );
        setExpandedResults((prev) => new Set(prev).add(messageIndex));
        toast({ 
          title: 'Search completed', 
          description: `Found ${result.data.total.toLocaleString()} results` 
        });
      } else {
        toast({ 
          title: 'Search failed', 
          description: result.error || 'Unknown error occurred',
          variant: 'destructive' 
        });
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex ? { ...msg, isSearching: false } : msg
          )
        );
      }
    } catch (error) {
      toast({ 
        title: 'Search failed', 
        description: error instanceof Error ? error.message : 'Network error',
        variant: 'destructive' 
      });
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === messageIndex ? { ...msg, isSearching: false } : msg
        )
      );
    }
  };

  const downloadResults = (results: FofaSearchResult[], format: 'json' | 'csv', query: string) => {
    let content: string;
    let mimeType: string;
    let extension: string;
    const filename = `fofa-results-${Date.now()}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV format
      const headers = ['host', 'ip', 'port', 'protocol', 'country', 'country_name', 'region', 'city', 'as_organization', 'title', 'domain', 'server'];
      const csvRows = [
        headers.join(','),
        ...results.map(row => 
          headers.map(header => {
            const value = row[header as keyof FofaSearchResult] || '';
            // Escape quotes and wrap in quotes if contains comma or quote
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
              ? `"${escaped}"`
              : escaped;
          }).join(',')
        )
      ];
      content = csvRows.join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedFile(filename);
    toast({ 
      title: 'Download started',
      description: `${filename} (${results.length} results) saved to your Downloads folder`,
    });
    setTimeout(() => setDownloadedFile(null), 5000);
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
        <CardTitle className="flex items-center gap-2"><Search className="text-primary"/> FofaForge Query Builder</CardTitle>
        <CardDescription>Nexus translates natural language into precise FOFA queries. Describe what you want to find and get syntactically correct queries ready to execute.</CardDescription>
        {downloadedFile && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-3 py-2 rounded-md">
            <CheckCircle2 className="h-4 w-4" />
            <span>Downloaded: <strong>{downloadedFile}</strong> - Check your Downloads folder</span>
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
                      <pre><code>{message.query}</code></pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => copyToClipboard(message.query!)}
                      >
                        {hasCopied === message.query ? <Check className="text-green-500 h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Result Size Input */}
                    <div className="flex items-center gap-2">
                      <label htmlFor={`result-size-${index}`} className="text-xs text-muted-foreground whitespace-nowrap">
                        Max results:
                      </label>
                      <Input
                        id={`result-size-${index}`}
                        type="number"
                        min={1}
                        max={10000}
                        value={resultSize}
                        onChange={(e) => setResultSize(Math.min(10000, Math.max(1, parseInt(e.target.value) || 100)))}
                        className="w-24 h-7 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">(1-10,000)</span>
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
                            <a href={`https://fofa.info/result?qbase64=${base64Encode(message.query)}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" /> View on FOFA
                            </a>
                        </Button>
                        {message.searchResults && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-7"
                              onClick={() => downloadResults(message.searchResults!.results, 'json', message.query!)}
                            >
                              <FileJson className="h-3 w-3 mr-1" /> JSON
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-7"
                              onClick={() => downloadResults(message.searchResults!.results, 'csv', message.query!)}
                            >
                              <FileSpreadsheet className="h-3 w-3 mr-1" /> CSV
                            </Button>
                          </>
                        )}
                    </div>

                    {/* Search Results */}
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
                                  <TableHead className="w-[200px]">Host</TableHead>
                                  <TableHead>IP:Port</TableHead>
                                  <TableHead>Protocol</TableHead>
                                  <TableHead>Location</TableHead>
                                  <TableHead>Server</TableHead>
                                  <TableHead className="w-[200px]">Title</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {message.searchResults.results.map((result, rIdx) => (
                                  <TableRow key={rIdx}>
                                    <TableCell className="font-mono text-xs">
                                      <a 
                                        href={result.protocol === 'https' ? `https://${result.host}` : `http://${result.host}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1"
                                      >
                                        <Globe className="h-3 w-3" />
                                        {result.host.length > 30 ? result.host.slice(0, 30) + '...' : result.host}
                                      </a>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {result.ip}:{result.port}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {result.protocol}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        {result.country_name || result.country}
                                        {result.city && `, ${result.city}`}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div className="flex items-center gap-1">
                                        <Server className="h-3 w-3 text-muted-foreground" />
                                        {result.server || '-'}
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
                  <span className="text-sm text-muted-foreground">Nexus is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-2 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="e.g., search for exposed Jenkins servers in Germany"
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
