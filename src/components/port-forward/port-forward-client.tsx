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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRightLeft, 
  LoaderCircle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ShieldQuestion,
  Info,
  Copy,
  Check,
  Globe,
  Server,
} from 'lucide-react';
import { portForwardTestAction } from '@/app/actions';
import type { PortForwardTestResult, PortForwardTestOutput } from '@/ai/flows/port-forward-test';
import { useToast } from '@/hooks/use-toast';
import { useRecordActivity } from '@/lib/activity';

const COMMON_PORT_PRESETS = [
  { label: 'Web (80, 443, 8080)', value: '80,443,8080' },
  { label: 'SSH/RDP (22, 3389)', value: '22,3389' },
  { label: 'Database (3306, 5432, 27017)', value: '3306,5432,27017' },
  { label: 'Development (3000, 5000, 8000)', value: '3000,5000,8000' },
  { label: 'Gaming (25565, 27015, 7777)', value: '25565,27015,7777' },
  { label: 'Mail (25, 465, 587, 993)', value: '25,465,587,993' },
];

export function PortForwardClient() {
  const [host, setHost] = useState('');
  const [ports, setPorts] = useState('80,443,22,3389');
  const [protocol, setProtocol] = useState<'tcp' | 'udp' | 'both'>('tcp');
  const [timeout, setTimeout] = useState(5000);
  const [grabBanner, setGrabBanner] = useState(true);
  
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<PortForwardTestOutput | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();
  const { record: recordActivity } = useRecordActivity('port-forward');

  const handleTest = async () => {
    console.log('[v0] Port forward test initiated with:', { host, ports, protocol, timeout, grabBanner });
    
    if (!host) {
      toast({
        variant: 'destructive',
        title: 'Host is required',
        description: 'Enter an IP address, hostname, or use your public IP.',
      });
      return;
    }
    
    if (!ports) {
      toast({
        variant: 'destructive',
        title: 'Ports are required',
        description: 'Enter port numbers to test.',
      });
      return;
    }

    setIsTesting(true);
    setResults(null);

    try {
      console.log('[v0] Calling portForwardTestAction...');
      const response = await portForwardTestAction({ 
        host,
        ports,
        protocol,
        timeout,
        grabBanner,
      });
      console.log('[v0] portForwardTestAction response:', response);

      if (response.success && response.data) {
        setResults(response.data);
        
        recordActivity({
          target: host,
          summary: `${response.data.summary.open} of ${response.data.summary.total} ports open`,
        });
        
        toast({
          title: 'Test Complete',
          description: `Found ${response.data.summary.open} open ports out of ${response.data.summary.total} tested.`,
        });
      } else {
        console.error('[v0] Port forward test failed:', response.error);
        toast({
          variant: 'destructive',
          title: 'Test Failed',
          description: response.error,
        });
      }
    } catch (error) {
      console.error('[v0] Unexpected error in handleTest:', error);
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'An unexpected error occurred.',
      });
    }

    setIsTesting(false);
  };

  const getStatusIcon = (status: PortForwardTestResult['status']) => {
    switch (status) {
      case 'open':
        return <CheckCircle2 className="size-4 text-green-500" />;
      case 'closed':
        return <XCircle className="size-4 text-red-500" />;
      case 'filtered':
        return <ShieldQuestion className="size-4 text-yellow-500" />;
      case 'timeout':
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: PortForwardTestResult['status']) => {
    switch (status) {
      case 'open':
        return 'default' as const;
      case 'closed':
        return 'destructive' as const;
      case 'filtered':
        return 'secondary' as const;
      case 'timeout':
        return 'outline' as const;
    }
  };

  const copyResults = () => {
    if (!results) return;
    const text = results.results
      .map(r => `${r.port}/${r.protocol}: ${r.status}${r.service ? ` (${r.service})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (preset: string) => {
    setPorts(preset);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-5" />
            Port Forward Tester
          </CardTitle>
          <CardDescription>
            Test if your port forwarding rules are working correctly. Verify that ports are 
            accessible from the internet to diagnose NAT, firewall, or router configuration issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="host">Target Host</Label>
              <Input
                id="host"
                type="text"
                placeholder="Your public IP or hostname"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={isTesting}
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleTest()}
              />
              <p className="text-xs text-muted-foreground">
                Enter your public IP address or domain name to test external accessibility.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ports">Ports to Test</Label>
              <Input
                id="ports"
                type="text"
                placeholder="e.g., 80,443,8080 or 3000-3010"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                disabled={isTesting}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated ports or ranges. Max 100 ports.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Port Presets</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PORT_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.value)}
                  disabled={isTesting}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select value={protocol} onValueChange={(v) => setProtocol(v as typeof protocol)} disabled={isTesting}>
                <SelectTrigger id="protocol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Select value={String(timeout)} onValueChange={(v) => setTimeout(Number(v))} disabled={isTesting}>
                <SelectTrigger id="timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2000">2 seconds</SelectItem>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="10000">10 seconds</SelectItem>
                  <SelectItem value="30000">30 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Switch 
                  id="grab-banner" 
                  checked={grabBanner} 
                  onCheckedChange={setGrabBanner}
                  disabled={isTesting}
                />
                <Label htmlFor="grab-banner" className="cursor-pointer">
                  Grab service banners
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleTest} disabled={isTesting || !host || !ports} size="lg">
              {isTesting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowRightLeft />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Ports'}</span>
            </Button>
          </div>

          <div className="p-3 bg-blue-950/50 border border-blue-400/30 rounded-lg text-blue-300 flex items-start gap-3">
            <Info className="size-5 mt-0.5 shrink-0"/>
            <div className="text-sm">
              <p className="font-semibold">How it works</p>
              <p className="opacity-90">
                This tool attempts to connect to the specified ports from an external server, 
                simulating how someone on the internet would try to reach your services. 
                Use it to verify port forwarding, firewall rules, and service availability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isTesting && (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
          <LoaderCircle className="size-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Testing port connectivity...</h3>
          <p className="text-muted-foreground">Checking if ports are reachable from the internet.</p>
        </div>
      )}

      {results && !isTesting && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Test Results</CardTitle>
                <CardDescription className="mt-1 space-y-1">
                  <span className="flex items-center gap-2">
                    <Server className="size-4" />
                    Target: <span className="font-mono">{results.host}</span>
                    {results.resolvedIp && (
                      <span className="text-muted-foreground">({results.resolvedIp})</span>
                    )}
                  </span>
                  {results.externalIp && (
                    <span className="flex items-center gap-2">
                      <Globe className="size-4" />
                      Tested from: <span className="font-mono">{results.externalIp}</span>
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copyResults}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span className="sr-only">Copy results</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{results.summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Tested</div>
              </div>
              <div className="bg-green-950/30 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{results.summary.open}</div>
                <div className="text-sm text-green-400/80">Open</div>
              </div>
              <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{results.summary.closed}</div>
                <div className="text-sm text-red-400/80">Closed</div>
              </div>
              <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {results.summary.filtered + results.summary.timeout}
                </div>
                <div className="text-sm text-yellow-400/80">Filtered/Timeout</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Port Accessibility</span>
                <span className="text-muted-foreground">
                  {Math.round((results.summary.open / results.summary.total) * 100)}% reachable
                </span>
              </div>
              <Progress 
                value={(results.summary.open / results.summary.total) * 100} 
                className="h-2"
              />
            </div>

            {/* Results Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Port</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Banner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.results.map((result) => (
                  <TableRow key={`${result.port}-${result.protocol}`}>
                    <TableCell className="font-mono font-medium">{result.port}</TableCell>
                    <TableCell className="uppercase text-muted-foreground">{result.protocol}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(result.status)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(result.status)}
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.service || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {result.responseTime ? `${result.responseTime}ms` : '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                      {result.banner || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="text-sm text-muted-foreground text-center">
              Test completed in {(results.testTime / 1000).toFixed(2)} seconds
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
