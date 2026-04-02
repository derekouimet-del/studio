'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ScanLine, 
  LoaderCircle, 
  Server, 
  ShieldAlert, 
  AlertTriangle,
  Terminal,
  Settings2,
  Copy,
  Check
} from 'lucide-react';
import { networkScanAction } from '@/app/actions';
import type { PortScanResult } from '@/ai/flows/network-scan';
import { useToast } from '@/hooks/use-toast';
import { useRecordActivity } from '@/lib/activity';

type ScanType = 'quick' | 'standard' | 'deep' | 'stealth';

export function NetworkScanClient() {
  const [target, setTarget] = useState('scanme.nmap.org');
  const [ports, setPorts] = useState('');
  const [scanType, setScanType] = useState<ScanType>('quick');
  const [serviceDetection, setServiceDetection] = useState(true);
  const [osDetection, setOsDetection] = useState(false);
  const [scriptScan, setScriptScan] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<PortScanResult[]>([]);
  const [rawOutput, setRawOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();
  const { record: recordActivity } = useRecordActivity('scan');

  const handleScan = async () => {
    if (!target) {
      toast({
        variant: 'destructive',
        title: 'Target is required.',
      });
      return;
    }
    setIsScanning(true);
    setResults([]);
    setRawOutput('');

    const response = await networkScanAction({ 
      target,
      ports: ports || undefined,
      scanType,
      serviceDetection,
      osDetection,
      scriptScan,
    });

    if (response.success && response.data) {
      setResults(response.data.results);
      setRawOutput(response.data.rawOutput || '');
      
      recordActivity({
        target,
        summary: `${response.data.results.length} open ports found`,
      });
      
      if (response.data.results.length === 0) {
        toast({
          title: 'Scan Complete',
          description: `No open ports found for "${target}".`,
        });
      } else {
        toast({
          title: 'Scan Complete',
          description: `Found ${response.data.results.length} open ports for "${target}".`,
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: response.error,
      });
    }

    setIsScanning(false);
  };

  const getStatusBadgeVariant = (status: PortScanResult['status']) => {
    switch (status) {
      case 'Open':
        return 'destructive';
      case 'Filtered':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const copyRawOutput = () => {
    navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Network Scanner</CardTitle>
          <CardDescription>
            Perform real nmap scans against targets. Requires a self-hosted scanner service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <div className="flex w-full items-center gap-2">
              <Input
                id="target"
                type="text"
                placeholder="e.g., scanme.nmap.org or 192.168.1.0/24"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isScanning}
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <Button onClick={handleScan} disabled={isScanning || !target} className="shrink-0">
                {isScanning ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ScanLine />
                )}
                <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="scan-type">Scan Type</Label>
              <Select value={scanType} onValueChange={(v) => setScanType(v as ScanType)} disabled={isScanning}>
                <SelectTrigger id="scan-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick (Top 100 ports)</SelectItem>
                  <SelectItem value="standard">Standard (Top 1000)</SelectItem>
                  <SelectItem value="deep">Deep (All 65535 ports)</SelectItem>
                  <SelectItem value="stealth">Stealth (SYN scan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ports">Custom Ports (optional)</Label>
              <Input
                id="ports"
                type="text"
                placeholder="e.g., 22,80,443 or 1-1000"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                disabled={isScanning}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch 
                id="service-detection" 
                checked={serviceDetection} 
                onCheckedChange={setServiceDetection}
                disabled={isScanning}
              />
              <Label htmlFor="service-detection" className="cursor-pointer">
                <Settings2 className="inline size-4 mr-1 text-muted-foreground" />
                Service Detection (-sV)
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="os-detection" 
                checked={osDetection} 
                onCheckedChange={setOsDetection}
                disabled={isScanning}
              />
              <Label htmlFor="os-detection" className="cursor-pointer">
                <Server className="inline size-4 mr-1 text-muted-foreground" />
                OS Detection (-O)
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="script-scan" 
                checked={scriptScan} 
                onCheckedChange={setScriptScan}
                disabled={isScanning}
              />
              <Label htmlFor="script-scan" className="cursor-pointer">
                <Terminal className="inline size-4 mr-1 text-muted-foreground" />
                Script Scan (-sC)
              </Label>
            </div>
          </div>

          <div className="p-3 bg-yellow-950/50 border border-yellow-400/30 rounded-lg text-yellow-300 flex items-start gap-3">
            <AlertTriangle className="size-5 mt-0.5 shrink-0"/>
            <div className="text-sm">
              <p className="font-semibold">Responsible Scanning</p>
              <p className="opacity-90">Only scan targets you have explicit permission to test. Unauthorized scanning is illegal.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isScanning && (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
          <LoaderCircle className="size-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Scanning target network...</h3>
          <p className="text-muted-foreground">This may take a few moments depending on scan type.</p>
        </div>
      )}

      {(results.length > 0 || rawOutput) && !isScanning && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results for &quot;{target}&quot;</CardTitle>
            <CardDescription>
              Found {results.length} open or filtered ports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">Results Table</TabsTrigger>
                <TabsTrigger value="raw">Raw Output</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-4">
                {results.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Host</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={`${result.host}:${result.port}`}>
                          <TableCell className="font-medium font-mono flex items-center gap-2">
                            <Server className="text-muted-foreground size-4" />
                            {result.host}
                          </TableCell>
                          <TableCell className="font-mono">{result.port}</TableCell>
                          <TableCell>{result.service}</TableCell>
                          <TableCell className="font-mono text-sm">{result.version || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(result.status)}>
                              {result.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/scan/assessment/${result.host}?port=${result.port}&service=${encodeURIComponent(result.service)}&version=${encodeURIComponent(result.version)}`}>
                                <ShieldAlert className="size-4" /> Assess
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No open ports found.</p>
                )}
              </TabsContent>
              
              <TabsContent value="raw" className="mt-4">
                {rawOutput ? (
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={copyRawOutput}
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap max-h-96">
                      {rawOutput}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No raw output available.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
