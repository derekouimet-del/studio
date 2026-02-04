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
import { Badge } from '@/components/ui/badge';
import { ScanLine, LoaderCircle, Server, ShieldAlert, AlertTriangle } from 'lucide-react';
import { networkScanAction } from '@/app/actions';
import type { PortScanResult } from '@/ai/flows/network-scan';
import { useToast } from '@/hooks/use-toast';


export function NetworkScanClient() {
  const [target, setTarget] = useState('scanme.nmap.org'); // Changed to a public, scannable host
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<PortScanResult[]>([]);
  const { toast } = useToast();

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

    const response = await networkScanAction({ target });

    if (response.success && response.data) {
      setResults(response.data.results);
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Network Scanner</CardTitle>
          <CardDescription>
            Enter an IP address or domain to scan for open ports and services. This uses a backend tool to perform a real scan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., scanme.nmap.org"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isScanning}
              className="font-code"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <Button onClick={handleScan} disabled={isScanning || !target}>
              {isScanning ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ScanLine />
              )}
              <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
            </Button>
          </div>
          <div className="p-3 bg-yellow-950/50 border border-yellow-400/30 rounded-lg text-yellow-300 flex items-start gap-3">
            <AlertTriangle className="size-5 mt-1 flex-shrink-0"/>
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
            <p className="text-muted-foreground">This may take a few moments. Please wait.</p>
        </div>
      )}

      {results.length > 0 && !isScanning && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results for "{target}"</CardTitle>
            <CardDescription>
              Found {results.length} open or filtered ports.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableCell className="font-medium font-code flex items-center gap-2"><Server className="text-muted-foreground" />{result.host}</TableCell>
                    <TableCell>{result.port}</TableCell>
                    <TableCell>{result.service}</TableCell>
                    <TableCell className="font-code">{result.version}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(result.status)}>
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/scan/assessment/${result.host}?port=${result.port}&service=${encodeURIComponent(result.service)}&version=${encodeURIComponent(result.version)}`}>
                          <ShieldAlert /> Assess
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
