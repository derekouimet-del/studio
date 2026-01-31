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
import { ScanLine, LoaderCircle, Server, ShieldAlert } from 'lucide-react';
import { scanResults, type ScanResult } from '@/lib/data';

export function NetworkScanClient() {
  const [target, setTarget] = useState('192.168.1.0/24');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);

  const handleScan = () => {
    setIsScanning(true);
    setResults([]);
    setTimeout(() => {
      setResults(scanResults);
      setIsScanning(false);
    }, 2000);
  };

  const getStatusBadgeVariant = (status: ScanResult['status']) => {
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
          <CardTitle>Scan Network</CardTitle>
          <CardDescription>
            Enter an IP address, domain, or CIDR range to scan for live hosts,
            open ports, and services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., 192.168.1.0/24"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={isScanning}
              className="font-code"
            />
            <Button onClick={handleScan} disabled={isScanning}>
              {isScanning ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ScanLine />
              )}
              <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
            </Button>
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

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>
              Found {results.length} active hosts with open ports.
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
                  <TableRow key={result.id}>
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
                        <Link href={`/scan/assessment/${result.host}`}>
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
