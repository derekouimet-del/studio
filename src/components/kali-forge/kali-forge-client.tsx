'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Terminal,
  LoaderCircle,
  Play,
  Copy,
  Check,
  AlertTriangle,
  History,
  Trash2,
  Clock,
} from 'lucide-react';
import { kaliForgeAction } from '@/app/actions';
import type { KaliForgeOutput } from '@/ai/flows/kali-forge';
import { useToast } from '@/hooks/use-toast';
import { useRecordActivity } from '@/lib/activity';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommandHistoryItem {
  command: string;
  output: KaliForgeOutput;
  timestamp: Date;
}

const EXAMPLE_COMMANDS = [
  { label: 'Nmap Quick Scan', command: 'nmap -T4 -F scanme.nmap.org' },
  { label: 'Nikto Web Scan', command: 'nikto -h http://example.com' },
  { label: 'Directory Brute', command: 'gobuster dir -u http://example.com -w /usr/share/wordlists/dirb/common.txt' },
  { label: 'DNS Lookup', command: 'dig example.com ANY' },
  { label: 'Whois Lookup', command: 'whois example.com' },
  { label: 'SSL Check', command: 'sslscan example.com' },
];

export function KaliForgeClient() {
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<KaliForgeOutput | null>(null);
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { record: recordActivity } = useRecordActivity('kali-forge');

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleExecute = async () => {
    if (!command.trim()) {
      toast({
        variant: 'destructive',
        title: 'Command is required.',
      });
      return;
    }

    setIsExecuting(true);
    setCurrentOutput(null);

    const response = await kaliForgeAction({ command: command.trim() });

    if (response.success && response.data) {
      setCurrentOutput(response.data);

      // Add to history
      setHistory((prev) => [
        { command: command.trim(), output: response.data!, timestamp: new Date() },
        ...prev.slice(0, 19), // Keep last 20 commands
      ]);

      recordActivity({
        target: command.split(' ')[0],
        summary: response.data.success
          ? `Executed: ${command.substring(0, 50)}${command.length > 50 ? '...' : ''}`
          : 'Command failed',
      });

      toast({
        title: response.data.success ? 'Command Executed' : 'Execution Failed',
        description: response.data.success
          ? `Exit code: ${response.data.exitCode}`
          : response.data.error,
        variant: response.data.success ? 'default' : 'destructive',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Execution Failed',
        description: response.error,
      });
    }

    setIsExecuting(false);
  };

  const copyOutput = () => {
    if (!currentOutput?.output) return;
    navigator.clipboard.writeText(currentOutput.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    toast({ title: 'History cleared' });
  };

  const loadFromHistory = (item: CommandHistoryItem) => {
    setCommand(item.command);
    setCurrentOutput(item.output);
  };

  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return '-';
    if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            Kali Forge
          </CardTitle>
          <CardDescription>
            Execute Kali Linux commands on your self-hosted scanner service. Enter any
            command-line syntax and receive real-time results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Command Input */}
          <div className="space-y-2">
            <div className="flex w-full items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  $
                </span>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter Kali Linux command..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  disabled={isExecuting}
                  className="font-mono pl-7"
                  onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                />
              </div>
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !command.trim()}
                className="shrink-0"
              >
                {isExecuting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
              </Button>
            </div>
          </div>

          {/* Example Commands */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quick commands:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_COMMANDS.map((ex) => (
                <Badge
                  key={ex.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setCommand(ex.command)}
                >
                  {ex.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-950/50 border border-yellow-400/30 rounded-lg text-yellow-300 flex items-start gap-3">
            <AlertTriangle className="size-5 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Responsible Usage</p>
              <p className="opacity-90">
                Only execute commands against systems you have explicit permission to test.
                Unauthorized access is illegal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executing Indicator */}
      {isExecuting && (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
          <LoaderCircle className="size-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Executing command...</h3>
          <p className="text-muted-foreground font-mono text-sm">{command}</p>
        </div>
      )}

      {/* Results */}
      {currentOutput && !isExecuting && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-base">
                $ {currentOutput.command}
              </CardTitle>
              <div className="flex items-center gap-2">
                {currentOutput.executionTime !== undefined && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="size-3" />
                    {formatTime(currentOutput.executionTime)}
                  </Badge>
                )}
                <Badge
                  variant={currentOutput.success ? 'default' : 'destructive'}
                >
                  Exit: {currentOutput.exitCode ?? 'N/A'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="output">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="size-4 mr-1" />
                    History ({history.length})
                  </TabsTrigger>
                </TabsList>
                {currentOutput.output && (
                  <Button variant="ghost" size="sm" onClick={copyOutput}>
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                )}
              </div>

              <TabsContent value="output" className="mt-4">
                {currentOutput.error && !currentOutput.success ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-destructive font-medium">Error</p>
                    <p className="text-sm mt-1">{currentOutput.error}</p>
                  </div>
                ) : (
                  <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    {currentOutput.output || 'No output'}
                  </pre>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                {history.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="size-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {history.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => loadFromHistory(item)}
                          >
                            <div className="flex items-center justify-between">
                              <code className="text-sm font-mono truncate flex-1">
                                $ {item.command}
                              </code>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <Badge
                                  variant={
                                    item.output.success ? 'outline' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {item.output.success ? 'OK' : 'ERR'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {item.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No command history yet.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
