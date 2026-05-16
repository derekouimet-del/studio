'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LoaderCircle,
  Upload,
  FileWarning,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  AlertTriangle,
  FileText,
  Hash,
  HardDrive,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScanStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  timeout: number;
  failure: number;
}

interface ScanResult {
  engine_name: string;
  category: string;
  result: string | null;
  method: string;
  engine_version?: string;
  engine_update?: string;
}

interface FileInfo {
  sha256: string;
  sha1: string;
  md5: string;
  size: number;
  type_description?: string;
  type_tag?: string;
  magic?: string;
  meaningful_name?: string;
  names?: string[];
}

interface ScanData {
  status: 'queued' | 'completed';
  stats?: ScanStats;
  results?: Record<string, ScanResult>;
  fileInfo?: FileInfo;
}

export function VirusScannerClient() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Max file size: 4.5MB to stay under Vercel's serverless function limit
  const MAX_FILE_SIZE = 4.5 * 1024 * 1024;

  const validateFileSize = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Maximum file size is 4.5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
      });
      return false;
    }
    return true;
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFileSize(file)) {
        setSelectedFile(file);
        setScanData(null);
      }
    }
  }, [validateFileSize]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFileSize(file)) {
        setSelectedFile(file);
        setScanData(null);
      }
    }
  }, [validateFileSize]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setScanData(null);
    setAnalysisId(null);
    setScanProgress(0);
  }, []);

  const pollAnalysis = useCallback(async (id: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async (): Promise<ScanData | null> => {
      attempts++;
      setScanProgress(Math.min((attempts / maxAttempts) * 100, 95));

      const response = await fetch(`/api/virustotal/analysis/${id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('[v0] Analysis API error:', response.status, errorText);
        throw new Error(`Analysis request failed: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.log('[v0] Failed to parse analysis response');
        throw new Error('Invalid response from analysis API');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analysis');
      }

      if (result.data.status === 'completed') {
        setScanProgress(100);
        return result.data;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Analysis timed out. Please try again.');
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      return poll();
    };

    return poll();
  }, []);

  const handleScan = async () => {
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanData(null);

    try {
      console.log('[v0] Starting scan for file:', selectedFile.name, 'Size:', selectedFile.size);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('[v0] Sending request to /api/virustotal/scan');
      const uploadResponse = await fetch('/api/virustotal/scan', {
        method: 'POST',
        body: formData,
      });

      console.log('[v0] Upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.log('[v0] Upload error response:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      let uploadResult;
      try {
        uploadResult = await uploadResponse.json();
      } catch (e) {
        console.log('[v0] Failed to parse upload response');
        throw new Error('Invalid response from server');
      }
      console.log('[v0] Upload result:', uploadResult);

      if (!uploadResult.success) {
        console.log('[v0] Upload failed:', uploadResult.error);
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('[v0] Upload successful, analysis ID:', uploadResult.data.analysisId);
      setAnalysisId(uploadResult.data.analysisId);
      setScanProgress(10);

      toast({ title: 'File uploaded', description: 'Scanning in progress...' });

      const analysisResult = await pollAnalysis(uploadResult.data.analysisId);

      if (analysisResult) {
        setScanData(analysisResult);
        
        const stats = analysisResult.stats;
        if (stats) {
          if (stats.malicious > 0) {
            toast({
              variant: 'destructive',
              title: 'Threats Detected!',
              description: `${stats.malicious} engine(s) detected malicious content.`,
            });
          } else if (stats.suspicious > 0) {
            toast({
              title: 'Suspicious Activity',
              description: `${stats.suspicious} engine(s) flagged suspicious content.`,
            });
          } else {
            toast({
              title: 'Scan Complete',
              description: 'No threats detected.',
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: error.message || 'An error occurred during scanning',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getThreatLevel = (stats: ScanStats) => {
    if (stats.malicious > 0) return 'critical';
    if (stats.suspicious > 0) return 'warning';
    return 'safe';
  };

  const getDetectionRate = (stats: ScanStats) => {
    const total = stats.malicious + stats.suspicious + stats.undetected + stats.harmless;
    return total > 0 ? ((stats.malicious + stats.suspicious) / total) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VirusTotal File Scanner</CardTitle>
          <CardDescription>
            Upload a file to scan it against 70+ antivirus engines using VirusTotal. 
            Maximum file size: 4.5MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 transition-colors',
              'flex flex-col items-center justify-center gap-4 min-h-[200px]',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              selectedFile && 'bg-muted/50'
            )}
          >
            {selectedFile ? (
              <div className="flex items-center gap-4 w-full max-w-md">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="size-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  disabled={isScanning}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="size-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium">Drop a file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supports any file type up to 4.5MB
                  </p>
                </div>
              </>
            )}
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={isScanning}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* Scan Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleScan}
              disabled={!selectedFile || isScanning}
              className="min-w-[200px]"
            >
              {isScanning ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" />
                  Scanning...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2" />
                  Scan File
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="space-y-2">
              <Progress value={scanProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {scanProgress < 10
                  ? 'Uploading file...'
                  : scanProgress < 95
                  ? 'Analyzing file with antivirus engines...'
                  : 'Finalizing results...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {scanData && scanData.status === 'completed' && scanData.stats && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getThreatLevel(scanData.stats) === 'critical' ? (
                  <ShieldAlert className="size-5 text-destructive" />
                ) : getThreatLevel(scanData.stats) === 'warning' ? (
                  <ShieldQuestion className="size-5 text-yellow-500" />
                ) : (
                  <ShieldCheck className="size-5 text-green-500" />
                )}
                Scan Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Threat Level Banner */}
              <div
                className={cn(
                  'p-4 rounded-lg flex items-start gap-3',
                  getThreatLevel(scanData.stats) === 'critical'
                    ? 'bg-destructive/20 border border-destructive'
                    : getThreatLevel(scanData.stats) === 'warning'
                    ? 'bg-yellow-500/20 border border-yellow-500'
                    : 'bg-green-500/20 border border-green-500'
                )}
              >
                {getThreatLevel(scanData.stats) === 'critical' ? (
                  <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                ) : getThreatLevel(scanData.stats) === 'warning' ? (
                  <FileWarning className="size-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="size-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-semibold">
                    {getThreatLevel(scanData.stats) === 'critical'
                      ? 'Malware Detected!'
                      : getThreatLevel(scanData.stats) === 'warning'
                      ? 'Suspicious File'
                      : 'No Threats Found'}
                  </h4>
                  <p className="text-sm opacity-90">
                    {getThreatLevel(scanData.stats) === 'critical'
                      ? `${scanData.stats.malicious} security vendors flagged this file as malicious.`
                      : getThreatLevel(scanData.stats) === 'warning'
                      ? `${scanData.stats.suspicious} security vendors flagged this file as suspicious.`
                      : 'This file appears to be safe based on all security vendors.'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-destructive/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {scanData.stats.malicious}
                  </p>
                  <p className="text-xs text-muted-foreground">Malicious</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {scanData.stats.suspicious}
                  </p>
                  <p className="text-xs text-muted-foreground">Suspicious</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {scanData.stats.harmless}
                  </p>
                  <p className="text-xs text-muted-foreground">Harmless</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{scanData.stats.undetected}</p>
                  <p className="text-xs text-muted-foreground">Undetected</p>
                </div>
              </div>

              {/* Detection Rate */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Detection Rate</span>
                  <span className="font-medium">
                    {getDetectionRate(scanData.stats).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={getDetectionRate(scanData.stats)}
                  className={cn(
                    'h-2',
                    getDetectionRate(scanData.stats) > 0 ? 'bg-destructive/20' : 'bg-green-500/20'
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Info Card */}
          {scanData.fileInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="size-5" />
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scanData.fileInfo.type_description && (
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">{scanData.fileInfo.type_tag || 'File'}</Badge>
                    <span className="text-sm">{scanData.fileInfo.type_description}</span>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Hash className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">SHA256</p>
                      <p className="font-mono text-xs break-all">{scanData.fileInfo.sha256}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">MD5</p>
                      <p className="font-mono text-xs break-all">{scanData.fileInfo.md5}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-4 text-muted-foreground" />
                    <span>Size: {formatFileSize(scanData.fileInfo.size)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          {scanData.results && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Engine Results</CardTitle>
                <CardDescription>
                  Detailed results from {Object.keys(scanData.results).length} antivirus engines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {Object.entries(scanData.results)
                      .sort(([, a], [, b]) => {
                        const order = { malicious: 0, suspicious: 1, undetected: 2, harmless: 3 };
                        return (
                          (order[a.category as keyof typeof order] ?? 4) -
                          (order[b.category as keyof typeof order] ?? 4)
                        );
                      })
                      .map(([engine, result]) => (
                        <div
                          key={engine}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg',
                            result.category === 'malicious'
                              ? 'bg-destructive/10'
                              : result.category === 'suspicious'
                              ? 'bg-yellow-500/10'
                              : 'bg-muted/50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {result.category === 'malicious' ? (
                              <ShieldAlert className="size-4 text-destructive" />
                            ) : result.category === 'suspicious' ? (
                              <ShieldQuestion className="size-4 text-yellow-500" />
                            ) : (
                              <ShieldCheck className="size-4 text-green-500" />
                            )}
                            <span className="font-medium">{result.engine_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.result && (
                              <Badge
                                variant={
                                  result.category === 'malicious'
                                    ? 'destructive'
                                    : result.category === 'suspicious'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {result.result}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {result.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
