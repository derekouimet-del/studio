'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { dataSieveAction } from '@/app/actions';
import { LoaderCircle, Filter, UploadCloud, Info, Copy, FileText, Trash2, ShieldAlert } from 'lucide-react';
import type { DataSieveOutput } from '@/ai/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

type FoundData = DataSieveOutput['foundData'][0];

export function DataSieveClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FoundData[] | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setIsLoading(false);
    setResults(null);
    setFile(null);
    setFileContent(null);
  }

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Limit increased to 15MB to stay within the 20MB server action limit (accounting for JSON overhead)
    if (selectedFile.size > 15 * 1024 * 1024) { 
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Please upload files smaller than 15MB.' });
        return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileContent(reader.result as string);
      toast({title: `File "${selectedFile.name}" loaded.`});
    };
    reader.readAsText(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!fileContent) {
      toast({ variant: 'destructive', title: 'No file content to analyze' });
      return;
    }
    setIsLoading(true);
    setResults(null);

    const response = await dataSieveAction({ content: fileContent });

    if (response.success && response.data) {
        setResults(response.data.foundData);
        if (response.data.foundData.length === 0) {
            toast({ title: 'Analysis Complete', description: 'No sensitive data was found.' });
        } else {
             toast({ 
                title: 'Deep Sieve Complete', 
                description: `Discovered ${response.data.foundData.length} items with classification.`,
                variant: response.data.foundData.some(d => d.severity === 'critical') ? 'destructive' : 'default'
             });
        }
    } else {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: response.error || 'The server returned an unexpected response. The file might be too large.' });
    }
    setIsLoading(false);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="bg-red-700 animate-pulse">CRITICAL</Badge>;
      case 'high': return <Badge variant="destructive">HIGH</Badge>;
      case 'medium': return <Badge className="bg-yellow-600">MEDIUM</Badge>;
      case 'low': return <Badge variant="secondary">LOW</Badge>;
      case 'info': return <Badge variant="outline">INFO</Badge>;
      default: return null;
    }
  };


  return (
    <div className="space-y-8">
      <Card>
          <CardHeader>
            <CardTitle>DataSieve Pro: Deep Secret Extractor</CardTitle>
            <CardDescription>
                Upload source code, logs, or config files. DataSieve runs a high-performance classification engine + GenAI to find every leak.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFileChange(e.dataTransfer.files?.[0] || null); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onClick={() => document.getElementById('file-upload-datasieve')?.click()}
                className={cn(
                    'relative flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
                    isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                )}
                >
                <UploadCloud className="size-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                    Drag & drop a file here, or click to select one.
                </p>
                <input type="file" id="file-upload-datasieve" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="hidden" />
              </div>
              {file && (
                  <div className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="text-primary" />
                        <span>Loaded: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetState}><Trash2/></Button>
                  </div>
              )}
              <div className="p-3 bg-muted/30 border rounded-lg flex items-start gap-3">
                  <ShieldAlert className="size-5 mt-1 flex-shrink-0 text-primary"/>
                  <div className="text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Multi-Pass Analysis Enabled</p>
                      <p>Files are scanned for specific patterns (AWS, Google Cloud, JWT) instantly, followed by a targeted AI scan for logical credentials.</p>
                  </div>
              </div>
              <Button onClick={handleAnalyze} disabled={isLoading || !fileContent} className="w-full h-12 text-lg">
                {isLoading ? <LoaderCircle className="animate-spin" /> : <Filter />}
                {isLoading ? 'Running Deep Sieve...' : 'Sieve Data'}
              </Button>
          </CardContent>
      </Card>
      
      {isLoading && (
         <div className="flex flex-col items-center justify-center text-center p-12 space-y-4 rounded-lg border border-dashed animate-in fade-in zoom-in">
            <LoaderCircle className="size-16 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Performing Deep Content Analysis...</h3>
            <p className="text-muted-foreground">The dual-pass engine is extracting secrets. This may take longer for large files.</p>
        </div>
      )}

      {results && !isLoading && (
        <Card className={cn(results.some(r => r.severity === 'critical') && "border-destructive/50")}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="text-primary"/> Analysis Results
                </CardTitle>
                <CardDescription>Found {results.length} piece(s) of potentially sensitive information.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Severity</TableHead>
                            <TableHead className="w-[150px]">Type</TableHead>
                            <TableHead>Value (Unredacted)</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                    No sensitive data identified in this file.
                                </TableCell>
                            </TableRow>
                        ) : (
                            results.map((item) => (
                                <TableRow key={item.id} className={cn(item.severity === 'critical' && "bg-destructive/5")}>
                                    <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                                    <TableCell>
                                        <span className="font-semibold">{item.type}</span>
                                    </TableCell>
                                    <TableCell className="font-code text-xs break-all max-w-[300px]">
                                        {item.value}
                                        {item.context && (
                                            <div className="mt-1 text-[10px] text-muted-foreground italic truncate">
                                                Context: ...{item.context.slice(0, 100)}...
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.value)}>
                                            <Copy className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
