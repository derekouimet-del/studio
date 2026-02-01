'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateBreachedPasswordsAction, checkPasswordStrengthAction } from '@/app/actions';
import { LoaderCircle, Sparkles, AlertTriangle, Shield, KeyRound, Clipboard, Download } from 'lucide-react';
import type { GenerateBreachedPasswordsOutput } from '@/ai/flows/generate-breached-passwords';
import type { CheckPasswordStrengthOutput } from '@/ai/flows/check-password-strength';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function BreachInspectorClient() {
  const { toast } = useToast();

  // State for generator
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generatedResult, setGeneratedResult] = useState<GenerateBreachedPasswordsOutput | null>(null);

  // State for checker
  const [isChecking, setIsChecking] = useState(false);
  const [passwordToCheck, setPasswordToCheck] = useState('');
  const [checkedResult, setCheckedResult] = useState<CheckPasswordStrengthOutput | null>(null);

  const handleGenerate = async () => {
    if (!generateTopic) {
      toast({ variant: 'destructive', title: 'Topic is required' });
      return;
    }
    setIsGenerating(true);
    setGeneratedResult(null);
    const response = await generateBreachedPasswordsAction({ topic: generateTopic, count: 20 });
    if (response.success && response.data) {
      setGeneratedResult(response.data);
    } else {
      toast({ variant: 'destructive', title: 'Generation Failed', description: response.error });
    }
    setIsGenerating(false);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const downloadList = (passwords: string[]) => {
    const blob = new Blob([passwords.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generateTopic}-breached-passwords.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Download Started' });
  }

  const handleCheck = async () => {
    if (!passwordToCheck) {
      toast({ variant: 'destructive', title: 'Password is required' });
      return;
    }
    setIsChecking(true);
    setCheckedResult(null);
    const response = await checkPasswordStrengthAction({ password: passwordToCheck });
    if (response.success && response.data) {
      setCheckedResult(response.data);
    } else {
      toast({ variant: 'destructive', title: 'Check Failed', description: response.error });
    }
    setIsChecking(false);
  };
  
  const getStrengthColor = (strength: CheckPasswordStrengthOutput['strength']) => {
    switch (strength) {
      case 'Weak': return 'bg-destructive';
      case 'Medium': return 'bg-yellow-500';
      case 'Strong': return 'bg-green-500';
      case 'Very Strong': return 'bg-primary';
      default: return 'bg-muted';
    }
  }

  return (
    <Tabs defaultValue="generator" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="generator">Leaked Password Generator</TabsTrigger>
        <TabsTrigger value="checker">Password Strength Checker</TabsTrigger>
      </TabsList>
      <TabsContent value="generator">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Wordlist Generator</CardTitle>
            <CardDescription>
              Generate a list of plausible, but FAKE, breached passwords based on a topic. Useful for creating targeted wordlists for dictionary attacks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generate-topic">Topic</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="generate-topic"
                  placeholder="e.g., a company name, hobby, person's name"
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  disabled={isGenerating}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <Button onClick={handleGenerate} disabled={isGenerating || !generateTopic}>
                  {isGenerating ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                  Generate
                </Button>
              </div>
            </div>
            
            {isGenerating && (
                <div className="flex items-center justify-center p-8 space-x-2 text-muted-foreground">
                    <LoaderCircle className="animate-spin size-5" />
                    <span>Generating wordlist based on "{generateTopic}"...</span>
                </div>
            )}

            {generatedResult && (
              <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        <span>Generated Passwords</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedResult.passwords.join('\n'))}><Clipboard/> Copy</Button>
                            <Button size="sm" variant="outline" onClick={() => downloadList(generatedResult.passwords)}><Download/> Download</Button>
                        </div>
                    </CardTitle>
                    <CardDescription>20 examples related to "{generateTopic}".</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="font-code text-sm space-y-1 p-4 rounded-md bg-background max-h-60 overflow-y-auto border">
                        {generatedResult.passwords.map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                </CardContent>
              </Card>
            )}

          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="checker">
        <Card>
          <CardHeader>
            <CardTitle>Password Strength & Leak Checker</CardTitle>
            <CardDescription>
              Analyze a password's strength and check if it's similar to commonly breached passwords.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="check-password">Password to Check</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="check-password"
                  type="password"
                  placeholder="Enter a password..."
                  value={passwordToCheck}
                  onChange={(e) => setPasswordToCheck(e.target.value)}
                  disabled={isChecking}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                />
                <Button onClick={handleCheck} disabled={isChecking || !passwordToCheck}>
                  {isChecking ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
                  Check Password
                </Button>
              </div>
            </div>

            {isChecking && (
                <div className="flex items-center justify-center p-8 space-x-2 text-muted-foreground">
                    <LoaderCircle className="animate-spin size-5" />
                    <span>Analyzing password...</span>
                </div>
            )}
            
            {checkedResult && (
                <div className="space-y-4 pt-4">
                    {checkedResult.isCommon && (
                        <div className="p-4 bg-destructive/20 border border-destructive rounded-lg flex items-start gap-3">
                            <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold text-destructive">Dangerously Common Password!</h4>
                                <p className="text-sm text-destructive/90">This password is one of the most commonly found in data breaches. It is extremely insecure and should never be used.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Shield className="size-4 text-muted-foreground"/>
                            <strong>Strength:</strong>
                            <span className={cn('font-semibold', {
                                'text-destructive': checkedResult.strength === 'Weak',
                                'text-yellow-500': checkedResult.strength === 'Medium',
                                'text-green-500': checkedResult.strength === 'Strong',
                                'text-primary': checkedResult.strength === 'Very Strong',
                            })}>{checkedResult.strength}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <strong>Entropy:</strong>
                            <span>{checkedResult.entropy.toFixed(2)} bits</span>
                        </div>
                    </div>
                    
                    <Progress value={(checkedResult.entropy / 128) * 100} className={cn('h-2', getStrengthColor(checkedResult.strength))} />

                    <div>
                        <h4 className="font-semibold mb-1">AI Feedback</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md border">{checkedResult.feedback}</p>
                    </div>

                </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
