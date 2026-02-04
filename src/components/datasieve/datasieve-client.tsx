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
import { LoaderCircle, Filter, UploadCloud, Info, Copy, FileText, Trash2 } from 'lucide-react';
import type { DataSieveOutput } from '@/ai/flows/data-sieve';
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

    if (selectedFile.size > 5 * 1024 * 1024) { // 5 MB limit
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Please upload files smaller than 5MB for analysis.' });
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
             toast({ title: 'Analysis Complete', description: `Found ${response.data.foundData.length} items.` });
        }
    } else {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: response.error });
    }
    setIsLoading(false);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };


  return (
    <div className="space-y-8">
      <Card>
          <CardHeader>
            <CardTitle>DataSieve Sensitive Data Extractor</CardTitle>
            <CardDescription>
                Upload a text-based file (e.g., .txt, .log, .json, .csv, source code) to scan for sensitive information like credentials, PII, and API keys.
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
                        <FileText />
                        <span>Loaded: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetState}><Trash2/></Button>
                  </div>
              )}
              <div className="p-3 bg-blue-950/50 border border-blue-400/30 rounded-lg text-blue-300 flex items-start gap-3">
                  <Info className="size-5 mt-1 flex-shrink-0"/>
                  <div className="text-sm">
                      <p className="font-semibold">PCAP file support is not yet available.</p>
                      <p className="opacity-90">This tool currently analyzes text-based files. Direct PCAP parsing is a complex feature planned for a future update.</p>
                  </div>
              </div>
              <Button onClick={handleAnalyze} disabled={isLoading || !fileContent} className="w-full">
                {isLoading ? <LoaderCircle className="animate-spin" /> : <Filter />}
                {isLoading ? 'Analyzing File...' : 'Sieve Data'}
              </Button>
          </CardContent>
      </Card>
      
      {isLoading && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Analyzing file contents...</h3>
            <p className="text-muted-foreground">The AI is scanning for sensitive data. This may take a moment for large files.</p>
        </div>
      )}

      {results && !isLoading && (
        <Card>
            <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>Found {results.length} piece(s) of potentially sensitive information in {file?.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Context</TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Badge variant="destructive">{item.type}</Badge>
                                </TableCell>
                                <TableCell className="font-code">{item.value}</TableCell>
                                <TableCell className="font-code text-muted-foreground text-xs italic">...{item.context}...</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.value)}>
                                        <Copy className="size-4" />
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
