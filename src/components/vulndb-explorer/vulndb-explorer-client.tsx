'use client';

import { useState } from 'react';
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
import { LoaderCircle, DatabaseZap, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vulndbExplorerAction } from '@/app/actions';
import { type VulnDBExplorerOutput } from '@/ai/flows/vulndb-explorer';
import { cn } from '@/lib/utils';

type Vulnerability = VulnDBExplorerOutput['vulnerabilities'][0];

export function VulnDBExplorerClient() {
  const [product, setProduct] = useState('');
  const [version, setVersion] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Vulnerability[] | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!product) {
      toast({
        variant: 'destructive',
        title: 'Product name is required.',
      });
      return;
    }
    setIsSearching(true);
    setResults(null);

    const response = await vulndbExplorerAction({ product, version });

    if (response.success && response.data) {
      setResults(response.data.vulnerabilities);
      if (response.data.vulnerabilities.length === 0) {
        toast({
          title: 'No vulnerabilities found',
          description: `The AI couldn't find any known CVEs for "${product}${version ? ` v${version}` : ''}".`,
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: response.error,
      });
    }

    setIsSearching(false);
  };
  
  const getSeverityBadgeVariant = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };
  
    const getSeverityIcon = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'Critical': return <AlertTriangle className="text-destructive" />;
      case 'High': return <AlertTriangle className="text-destructive/80" />;
      case 'Medium': return <Shield className="text-yellow-500" />;
      case 'Low': return <CheckCircle className="text-green-500" />;
      default: return <Shield className="text-muted-foreground"/>;
    }
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Vulnerability Database Explorer</CardTitle>
          <CardDescription>
            Search for known vulnerabilities (CVEs) for a specific software product and version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-xl items-center space-x-2">
            <Input
              type="text"
              placeholder="Product (e.g., OpenSSH, Apache)"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              disabled={isSearching}
            />
            <Input
              type="text"
              placeholder="Version (optional)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              disabled={isSearching}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching || !product}>
              {isSearching ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <DatabaseZap />
              )}
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSearching && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Searching vulnerability database...</h3>
            <p className="text-muted-foreground">The AI is querying its knowledge base for CVEs.</p>
        </div>
      )}

      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Found {results.length} vulnerabilities for "{product}{version ? ` v${version}` : ''}"</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((vuln) => (
              <div key={vuln.cveId} className="p-4 border rounded-lg bg-card flex gap-4">
                <div className="pt-1">
                    {getSeverityIcon(vuln.severity)}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold font-code">{vuln.cveId}</h4>
                         <Badge variant={getSeverityBadgeVariant(vuln.severity)}>{vuln.severity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{vuln.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {results && results.length === 0 && !isSearching && (
        <div className="text-center p-8">
            <p className="text-muted-foreground">No results found.</p>
        </div>
      )}
    </div>
  );
}
