'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeContentAuthenticityAction } from '@/app/actions';
import { LoaderCircle, Fingerprint, UploadCloud, FileVideo, FileAudio, Type } from 'lucide-react';
import type { ContentAuthenticityOutput } from '@/ai/flows/content-authenticity';
import { cn } from '@/lib/utils';

type AnalysisResult = ContentAuthenticityOutput;
type AnalysisType = 'text' | 'audio' | 'video';

// A simple circular progress component for displaying the percentage
const CircularProgress = ({ value }: { value: number }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    let colorClass = 'text-green-500';
    if (value > 40) colorClass = 'text-yellow-500';
    if (value > 70) colorClass = 'text-destructive';

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32">
                <circle
                    className="text-muted"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
                <circle
                    className={cn("transform -rotate-90 origin-center transition-all duration-500", colorClass)}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
            </svg>
            <span className={cn("absolute text-3xl font-bold", colorClass)}>
                {value}%
            </span>
        </div>
    );
};


export function SynthalyzerClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // State for inputs
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setIsLoading(false);
    setResult(null);
    setTextInput('');
    setFile(null);
    setFilePreview(null);
  };

  const handleAnalysis = async (type: AnalysisType) => {
    setIsLoading(true);
    setResult(null);

    let response;
    if (type === 'text') {
      if (!textInput.trim()) {
        toast({ variant: 'destructive', title: 'Text is empty' });
        setIsLoading(false);
        return;
      }
      response = await analyzeContentAuthenticityAction({ contentType: 'text', textContent: textInput });
    } else {
      if (!file || !filePreview) {
        toast({ variant: 'destructive', title: 'No file selected' });
        setIsLoading(false);
        return;
      }
      response = await analyzeContentAuthenticityAction({ contentType: type, fileDataUri: filePreview });
    }

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: response.error });
    }
    setIsLoading(false);
  };
  
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Check file type for audio/video
    const currentTab = document.querySelector('[data-state="active"]')?.getAttribute('data-value');
    if(currentTab === 'audio' && !selectedFile.type.startsWith('audio/')) {
        toast({variant: 'destructive', title: 'Invalid File', description: 'Please upload an audio file.'});
        return;
    }
    if(currentTab === 'video' && !selectedFile.type.startsWith('video/')) {
        toast({variant: 'destructive', title: 'Invalid File', description: 'Please upload a video file.'});
        return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const FileDropzone = ({ type }: { type: 'audio' | 'video'}) => (
    <div className="space-y-4">
        <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onClick={() => document.getElementById(`file-upload-${type}`)?.click()}
            className={cn(
            'relative flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
            isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            )}
        >
            <UploadCloud className="size-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
            Drag & drop your {type} file here, or click to select a file.
            </p>
            <input
                type="file"
                id={`file-upload-${type}`}
                accept={`${type}/*`}
                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                className="hidden"
            />
        </div>
        {filePreview && file && file.type.startsWith(type) && (
            <div className="text-center text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                <p>Selected: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            </div>
        )}
        <Button onClick={() => handleAnalysis(type)} disabled={isLoading || !file} className="w-full">
            {isLoading ? <LoaderCircle className="animate-spin" /> : <Fingerprint />}
            Analyze {type.charAt(0).toUpperCase() + type.slice(1)}
        </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
          <CardHeader>
            <CardTitle>AI Content Detector</CardTitle>
            <CardDescription>
                Analyze text, audio, or video to determine the likelihood of it being generated by AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text" className="w-full" onValueChange={resetState}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text"><Type/>Text</TabsTrigger>
                <TabsTrigger value="audio"><FileAudio/>Audio</TabsTrigger>
                <TabsTrigger value="video"><FileVideo/>Video</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="pt-4">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste the text you want to analyze here..."
                    className="min-h-48"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button onClick={() => handleAnalysis('text')} disabled={isLoading || !textInput.trim()} className="w-full">
                    {isLoading ? <LoaderCircle className="animate-spin" /> : <Fingerprint />}
                    Analyze Text
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="audio" className="pt-4">
                <FileDropzone type="audio" />
              </TabsContent>
              <TabsContent value="video" className="pt-4">
                <FileDropzone type="video" />
              </TabsContent>
            </Tabs>
          </CardContent>
      </Card>
      
      {isLoading && (
         <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
            <LoaderCircle className="size-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Analyzing content...</h3>
            <p className="text-muted-foreground">The AI is examining the data for signs of generation. This may take a moment.</p>
        </div>
      )}

      {result && !isLoading && (
        <Card>
            <CardHeader>
                <CardTitle>Analysis Result</CardTitle>
                <CardDescription>The AI has assessed the likelihood of the content being generated.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                    <CircularProgress value={result.aiLikelihood} />
                    <p className="text-center font-semibold mt-2">AI-Generated Likelihood</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold">AI's Reasoning:</h4>
                    <p className="text-sm text-muted-foreground p-4 bg-muted border rounded-md whitespace-pre-wrap">{result.reasoning}</p>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
