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
import { LoaderCircle, Users, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { defaultPassAction } from '@/app/actions';
import { type DefaultPassOutput } from '@/ai/flows/default-pass';

type Credential = DefaultPassOutput['credentials'][0];

export function DefaultPassClient() {
  const [product, setProduct] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Credential[] | null>(null);
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

    const response = await defaultPassAction({ product });

    if (response.success && response.data) {
      setResults(response.data.credentials);
      if (response.data.credentials.length === 0) {
        toast({
          title: 'No credentials found',
          description: `The AI couldn't find any default credentials for "${product}".`,
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Default Credential Finder</CardTitle>
          <CardDescription>
            Search for common default usernames and passwords for a specific device, vendor, or software.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., Linksys Router, Hikvision Camera"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              disabled={isSearching}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching || !product}>
              {isSearching ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Users />
              )}
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSearching && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Searching for default credentials...</h3>
            <p className="text-muted-foreground">The AI is querying its knowledge base.</p>
        </div>
      )}

      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Default Credentials for "{product}"</CardTitle>
            <CardDescription>
              Found {results.length} common username/password combinations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((cred, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-code">{cred.username}</TableCell>
                    <TableCell className="font-code">{cred.password}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cred.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
