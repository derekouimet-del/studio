'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  LoaderCircle,
  Sparkles,
  Copy,
  Check,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { coderAction } from '@/app/actions';
import type { CoderOutput } from '@/ai/flows/coder';
import { useToast } from '@/hooks/use-toast';
import { useRecordActivity } from '@/lib/activity';
import { ScrollArea } from '@/components/ui/scroll-area';

const SUGGESTED_IDEAS = [
  {
    label: 'REST API',
    description: 'Build a REST API endpoint',
    prompt: 'Create a REST API endpoint in Python Flask that handles CRUD operations for a user management system with authentication.',
  },
  {
    label: 'React Component',
    description: 'Build a React component',
    prompt: 'Create a React component for a responsive image gallery with lazy loading and lightbox functionality.',
  },
  {
    label: 'CLI Tool',
    description: 'Build a command-line tool',
    prompt: 'Write a Python CLI tool that monitors system resources (CPU, memory, disk) and sends alerts when thresholds are exceeded.',
  },
  {
    label: 'Web Scraper',
    description: 'Build a web scraper',
    prompt: 'Create a Python web scraper using BeautifulSoup that extracts product data from an e-commerce page and saves it to CSV.',
  },
  {
    label: 'Database Schema',
    description: 'Design a database schema',
    prompt: 'Design a PostgreSQL database schema for a task management application with users, projects, tasks, and comments.',
  },
  {
    label: 'Auth System',
    description: 'Build an authentication system',
    prompt: 'Create a JWT-based authentication system in Node.js with Express, including login, register, and token refresh endpoints.',
  },
  {
    label: 'Data Pipeline',
    description: 'Build a data pipeline',
    prompt: 'Write a Python script that reads data from a CSV file, transforms it, and loads it into a SQLite database.',
  },
  {
    label: 'WebSocket Server',
    description: 'Build a WebSocket server',
    prompt: 'Create a WebSocket server in Node.js for a real-time chat application with rooms and private messaging.',
  },
];

export function CoderClient() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<CoderOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();
  const { record: recordActivity } = useRecordActivity('coder');

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Please describe what you want to build.',
      });
      return;
    }

    setIsGenerating(true);
    setOutput(null);

    const response = await coderAction({ prompt: prompt.trim() });

    if (response.success && response.data) {
      setOutput(response.data);

      recordActivity({
        target: 'code-generation',
        summary: response.data.success
          ? `Generated: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`
          : 'Generation failed',
      });

      toast({
        title: response.data.success ? 'Code Generated' : 'Generation Failed',
        description: response.data.success
          ? 'Your code has been generated successfully.'
          : response.data.error,
        variant: response.data.success ? 'default' : 'destructive',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: response.error,
      });
    }

    setIsGenerating(false);
  };

  const copyCode = () => {
    if (!output?.code) return;
    navigator.clipboard.writeText(output.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuggestionClick = (idea: typeof SUGGESTED_IDEAS[0]) => {
    setPrompt(idea.prompt);
    textareaRef.current?.focus();
  };

  const handleClear = () => {
    setPrompt('');
    setOutput(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="size-5" />
            Coder
          </CardTitle>
          <CardDescription>
            What do you want to build today? Describe your project and let AI generate the code for you using the Qwen3-Coder model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              placeholder="Describe the code you want to build... e.g., 'Create a Python function that reads a JSON file and converts it to CSV'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="min-h-[120px] font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Press Cmd/Ctrl + Enter to generate
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
            </Button>
            {(prompt || output) && (
              <Button variant="outline" onClick={handleClear}>
                <RefreshCw className="size-4" />
                <span>Clear</span>
              </Button>
            )}
          </div>

          {/* Suggested Ideas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lightbulb className="size-4" />
              <span>Need inspiration? Try one of these:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_IDEAS.map((idea) => (
                <Badge
                  key={idea.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3"
                  onClick={() => handleSuggestionClick(idea)}
                >
                  {idea.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generating Indicator */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 rounded-lg border border-dashed">
          <LoaderCircle className="size-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Generating code...</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            The AI is analyzing your request and writing production-ready code. This may take a moment.
          </p>
        </div>
      )}

      {/* Results */}
      {output && !isGenerating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generated Code</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={output.success ? 'default' : 'destructive'}>
                  {output.success ? 'Success' : 'Failed'}
                </Badge>
                {output.success && output.code && (
                  <Button variant="ghost" size="sm" onClick={copyCode}>
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {output.error && !output.success ? (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive font-medium">Error</p>
                <p className="text-sm mt-1">{output.error}</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                  {output.code || 'No code generated'}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
