'use client';

import { useState } from 'react';
import { Download, ImageIcon, LoaderCircle, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function AnyImageClient() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [space, setSpace] = useState<'anyImage' | 'qwenImage'>('anyImage');
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateImage() {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Prompt required', description: 'Describe the image you want to create.' });
      return;
    }

    setIsGenerating(true);
    setImage(null);
    try {
      const response = await fetch('/api/any-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, space }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Image generation failed.');
      setImage(data.image);
      toast({ title: 'Image generated', description: 'Any_Image returned your result.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation failed', description: error instanceof Error ? error.message : 'Could not reach Any_Image.' });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid max-w-6xl gap-6 xl:grid-cols-[minmax(280px,380px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><WandSparkles className="text-primary" /> Generate image</CardTitle>
          <CardDescription>Send a prompt to your private Any_Image Hugging Face Space.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label htmlFor="any-image-model">Model</Label>
          <select
            id="any-image-model"
            value={space}
            onChange={(event) => setSpace(event.target.value as 'anyImage' | 'qwenImage')}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            disabled={isGenerating}
          >
            <option value="anyImage">Any_Image</option>
            <option value="qwenImage">Qwen Image 2.1 Uncensored</option>
          </select>
          <Label htmlFor="any-image-prompt">Prompt</Label>
          <Textarea id="any-image-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="A cinematic reconnaissance map of a neon city at night..." className="min-h-36 resize-y" />
        </CardContent>
        <CardFooter>
          <Button onClick={generateImage} disabled={isGenerating} className="w-full">
            {isGenerating ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <WandSparkles data-icon="inline-start" />}
            {isGenerating ? 'Generating...' : 'Generate image'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="min-h-[420px]">
        <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="text-primary" /> Output</CardTitle><CardDescription>Your generated image will appear here.</CardDescription></CardHeader>
        <CardContent className="flex min-h-[300px] items-center justify-center">
          {image ? <img src={image} alt={prompt} className="max-h-[520px] w-full rounded-lg object-contain" /> : <div className="flex flex-col items-center gap-3 text-center text-muted-foreground"><ImageIcon className="size-12" /><p>Enter a prompt to generate an image.</p></div>}
        </CardContent>
        {image && <CardFooter><Button variant="outline" asChild><a href={image} download="any-image.png"><Download data-icon="inline-start" /> Download image</a></Button></CardFooter>}
      </Card>
    </div>
  );
}
