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
import { Globe, LoaderCircle, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { attackSurfaceMapperAction } from '@/app/actions';
import { useRecordActivity } from '@/lib/activity';

type Result = {
  subdomain: string;
  ip: string;
};

export function AttackSurfaceClient() {
  const [targetDomain, setTargetDomain] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const { toast } = useToast();
  const { record: recordActivity } = useRecordActivity('attack-surface');

  const handleScan = async () => {
    if (!targetDomain) {
      toast({
        variant: 'destructive',
        title: 'Target domain is required.',
      });
      return;
    }
    setIsScanning(true);
    setResults([]);

    const response = await attackSurfaceMapperAction({ domain: targetDomain });

    if (response.success && response.data) {
      setResults(response.data.results);
      
      // Record activity for dashboard
      recordActivity({
        target: targetDomain,
        summary: `${response.data.results.length} subdomains found`,
      });
      
      if (response.data.results.length === 0) {
        toast({
          title: 'No subdomains found',
          description: 'Could not discover any live subdomains for the target.',
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Map Attack Surface</CardTitle>
          <CardDescription>
            Enter a domain to discover its live subdomains and their corresponding IP addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., example.com"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              disabled={isScanning}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <Button onClick={handleScan} disabled={isScanning || !targetDomain}>
              {isScanning ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Globe />
              )}
              <span>{isScanning ? 'Mapping...' : 'Map Surface'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isScanning && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Discovering subdomains...</h3>
            <p className="text-muted-foreground">This may take a moment. Please wait.</p>
        </div>
      )}

      {results.length > 0 && !isScanning && (
        <Card>
          <CardHeader>
            <CardTitle>Discovered Assets for "{targetDomain}"</CardTitle>
            <CardDescription>
              Found {results.length} live subdomains.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium font-code flex items-center gap-2">
                        <Server className="text-muted-foreground" />
                        {result.subdomain}
                    </TableCell>
                    <TableCell className="font-code">{result.ip}</TableCell>
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
