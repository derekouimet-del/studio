'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Network,
  LoaderCircle,
  Play,
  Trash2,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe,
  Server,
  Cloud,
  Code,
  AlertTriangle,
  ShieldAlert,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import type {
  ScanMode,
  ScanOptions,
  ReconGraphResult,
  ReconNode,
  NodeType,
  RiskLevel,
} from '@/lib/recon-graph/types';
import {
  normalizeTarget,
  buildReconGraph,
  exportToJSON,
  exportToCSV,
} from '@/lib/recon-graph/service';

import { ReconFlowGraph } from './recon-flow-graph';
import { NodeDetailPanel } from './node-detail-panel';

const DEFAULT_OPTIONS: ScanOptions = {
  resolveSubdomains: true,
  checkPorts: true,
  detectTechnologies: true,
  matchCVEs: true,
  includeSSL: true,
};

export function ReconGraphClient() {
  const [target, setTarget] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('standard');
  const [options, setOptions] = useState<ScanOptions>(DEFAULT_OPTIONS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string[]>([]);
  const [result, setResult] = useState<ReconGraphResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<ReconNode | null>(null);
  const { toast } = useToast();

  const handleScan = useCallback(async () => {
    const normalized = normalizeTarget(target);

    if (!normalized.isValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid Target',
        description: normalized.error,
      });
      return;
    }

    setIsScanning(true);
    setResult(null);
    setSelectedNode(null);
    setScanProgress([]);

    // Simulate progress updates
    const progressSteps = [
      'Normalizing target input...',
      'Discovering subdomains...',
      'Resolving DNS records...',
      'Scanning ports...',
      'Detecting technologies...',
      'Matching CVEs...',
      'Building graph...',
    ];

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        const nextIndex = prev.length;
        if (nextIndex < progressSteps.length) {
          return [...prev, progressSteps[nextIndex]];
        }
        return prev;
      });
    }, 400);

    try {
      const graphResult = await buildReconGraph(
        normalized.sanitized,
        normalized.type!,
        scanMode,
        options
      );

      clearInterval(progressInterval);
      setScanProgress(progressSteps);

      setResult(graphResult);
      toast({
        title: 'Scan Complete',
        description: `Found ${graphResult.summary.totalNodes} nodes across ${graphResult.summary.subdomains} subdomains.`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: error instanceof Error ? error.message : 'An error occurred during scanning.',
      });
    } finally {
      setIsScanning(false);
    }
  }, [target, scanMode, options, toast]);

  const handleClear = () => {
    setTarget('');
    setResult(null);
    setSelectedNode(null);
    setScanProgress([]);
  };

  const handleExportJSON = () => {
    if (!result) return;
    const json = exportToJSON(result);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-${result.target}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!result) return;
    const csv = exportToCSV(result);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-${result.target}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'root':
        return <Globe className="size-4" />;
      case 'subdomain':
        return <Globe className="size-4" />;
      case 'ip':
        return <Server className="size-4" />;
      case 'service':
        return <Cloud className="size-4" />;
      case 'technology':
        return <Code className="size-4" />;
      case 'cve':
        return <AlertTriangle className="size-4" />;
      case 'ssl':
        return <Server className="size-4" />;
      case 'risk':
        return <ShieldAlert className="size-4" />;
      default:
        return <Globe className="size-4" />;
    }
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: RiskLevel): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (risk) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="size-5 text-primary" />
            Configure Recon Scan
          </CardTitle>
          <CardDescription>
            Enter a domain, subdomain, or IP address to generate an interactive recon map.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="text"
                placeholder="e.g., example.com, sub.example.com, or 192.168.1.1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isScanning}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                className="font-code"
              />
            </div>
            <div className="w-full lg:w-48 space-y-2">
              <Label htmlFor="mode">Scan Depth</Label>
              <Select
                value={scanMode}
                onValueChange={(v) => setScanMode(v as ScanMode)}
                disabled={isScanning}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="subdomains"
                checked={options.resolveSubdomains}
                onCheckedChange={(v) => setOptions({ ...options, resolveSubdomains: v })}
                disabled={isScanning}
              />
              <Label htmlFor="subdomains" className="text-sm cursor-pointer">
                Subdomains
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ports"
                checked={options.checkPorts}
                onCheckedChange={(v) => setOptions({ ...options, checkPorts: v })}
                disabled={isScanning}
              />
              <Label htmlFor="ports" className="text-sm cursor-pointer">
                Open Ports
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="tech"
                checked={options.detectTechnologies}
                onCheckedChange={(v) => setOptions({ ...options, detectTechnologies: v })}
                disabled={isScanning}
              />
              <Label htmlFor="tech" className="text-sm cursor-pointer">
                Technologies
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="cve"
                checked={options.matchCVEs}
                onCheckedChange={(v) => setOptions({ ...options, matchCVEs: v })}
                disabled={isScanning}
              />
              <Label htmlFor="cve" className="text-sm cursor-pointer">
                Match CVEs
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ssl"
                checked={options.includeSSL}
                onCheckedChange={(v) => setOptions({ ...options, includeSSL: v })}
                disabled={isScanning}
              />
              <Label htmlFor="ssl" className="text-sm cursor-pointer">
                SSL/TLS
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleScan} disabled={isScanning || !target}>
              {isScanning ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Play />
              )}
              <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={isScanning}>
              <Trash2 />
              <span>Clear</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isScanning && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <LoaderCircle className="size-12 animate-spin text-primary" />
              <h3 className="text-xl font-semibold">Running Recon Scan...</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                {scanProgress.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 justify-center">
                    <span className="text-green-400">✓</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!result && !isScanning && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center space-y-4">
              <Network className="size-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Ready to Map</h3>
              <p className="text-muted-foreground max-w-md">
                Enter a domain, subdomain, or IP address to generate a visual recon map showing infrastructure, services, and potential vulnerabilities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isScanning && (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{result.summary.totalNodes}</div>
                <p className="text-xs text-muted-foreground">Total Nodes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-400">{result.summary.subdomains}</div>
                <p className="text-xs text-muted-foreground">Subdomains</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-emerald-400">{result.summary.ips}</div>
                <p className="text-xs text-muted-foreground">IPs Found</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-amber-400">{result.summary.services}</div>
                <p className="text-xs text-muted-foreground">Services</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-400">{result.summary.cves}</div>
                <p className="text-xs text-muted-foreground">CVEs Matched</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className={cn('text-2xl font-bold', getRiskColor(result.overallRisk))}>
                  {result.overallRisk.toUpperCase()}
                </div>
                <p className="text-xs text-muted-foreground">Risk Level</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className="overflow-hidden">
            <Tabs defaultValue="graph" className="w-full">
              <CardHeader className="pb-0 border-b">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="graph">Graph</TabsTrigger>
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="raw">Raw Data</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportJSON}>
                      <FileJson className="size-4" />
                      <span className="hidden sm:inline">Export JSON</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <FileSpreadsheet className="size-4" />
                      <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <TabsContent value="graph" className="m-0">
                <div className="flex h-[600px]">
                  <div className={cn('flex-1 transition-all', selectedNode && 'mr-0')}>
                    <ReconFlowGraph
                      nodes={result.nodes}
                      edges={result.edges}
                      onNodeClick={setSelectedNode}
                    />
                  </div>
                  {selectedNode && (
                    <NodeDetailPanel
                      node={selectedNode}
                      onClose={() => setSelectedNode(null)}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="findings" className="m-0">
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Type</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Risk</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.nodes.map((node) => (
                          <TableRow
                            key={node.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedNode(node)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getNodeIcon(node.type)}
                                <span className="text-xs capitalize">{node.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-code text-sm">{node.label}</TableCell>
                            <TableCell>
                              {node.riskLevel && (
                                <Badge variant={getRiskBadgeVariant(node.riskLevel)} className="uppercase text-xs">
                                  {node.riskLevel}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                              {node.metadata ? JSON.stringify(node.metadata) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </TabsContent>

              <TabsContent value="raw" className="m-0">
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <pre className="p-4 text-xs font-code whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Graph Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-primary" />
                  <span>Root Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-blue-500" />
                  <span>Subdomain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-emerald-500" />
                  <span>IP Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-amber-500" />
                  <span>Service/Port</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-purple-500" />
                  <span>Technology</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-red-500" />
                  <span>CVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-cyan-500" />
                  <span>SSL Certificate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-red-600" />
                  <span>Risk Marker</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
