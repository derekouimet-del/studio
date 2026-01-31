'use client';

import { useState, useMemo } from 'react';
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
import { Target, LoaderCircle, Search } from 'lucide-react';
import { httpHunterAction } from '@/app/actions';
import type { HttpHunterOutput } from '@/ai/flows/http-hunter';
import { useToast } from '@/hooks/use-toast';

type HuntResult = HttpHunterOutput['results'][0];

export function HttpHunterClient() {
  const [targetDomain, setTargetDomain] = useState('example.com');
  const [isHunting, setIsHunting] = useState(false);
  const [results, setResults] = useState<HuntResult[]>([]);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();

  const handleHunt = async () => {
    setIsHunting(true);
    setResults([]);

    const response = await httpHunterAction({ targetDomain });

    if (response.success && response.data) {
      setResults(response.data.results || []);
      if (response.data.results.length === 0) {
        toast({
          title: 'No Live Subdomains Found',
          description: `HTTP Hunter couldn't find any live servers on common subdomains for ${targetDomain}.`,
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Hunt Failed',
        description: response.error,
      });
    }

    setIsHunting(false);
  };
  
  const getStatusBadgeVariant = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400) return 'destructive';
    if (statusCode >= 300) return 'secondary';
    return 'outline';
  };

  const filteredResults = useMemo(() => {
    if (!filter) return results;
    return results.filter(r => 
        r.url.toLowerCase().includes(filter.toLowerCase()) || 
        r.title?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [results, filter]);


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Hunt for Subdomains</CardTitle>
          <CardDescription>
            Enter a domain to probe for live web servers on common subdomains and retrieve their titles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="example.com"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              disabled={isHunting}
            />
            <Button onClick={handleHunt} disabled={isHunting}>
              {isHunting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Target />
              )}
              <span>{isHunting ? 'Hunting...' : 'Hunt'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isHunting && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Hunting for live servers...</h3>
            <p className="text-muted-foreground">This may take a moment. Probing common subdomains for {targetDomain}.</p>
        </div>
      )}

      {results.length > 0 && !isHunting && (
        <Card>
            <CardHeader>
                <CardTitle>Hunt Results</CardTitle>
                <CardDescription>Found {results.length} live endpoints. You can filter the results below.</CardDescription>
                 <div className="relative pt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by URL or title..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent>
                 <div className="max-h-[600px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Title / Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredResults.map(res => (
                                <TableRow key={res.id}>
                                    <TableCell className="font-code"><a href={res.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{res.url}</a></TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(res.statusCode) as any}>{res.statusCode}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        {res.title}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
