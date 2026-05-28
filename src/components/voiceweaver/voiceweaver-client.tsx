'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Wand2, AudioLines, RefreshCw } from 'lucide-react';

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

export function VoiceWeaverClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [text, setText] = useState('Hello, world! This is a test of the text to speech engine.');
  const [voice, setVoice] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);

  const fetchVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/voices');
      const data = await response.json();
      
      if (response.ok && data.voices) {
        setVoices(data.voices);
        // Set default voice if not already set
        if (!voice && data.voices.length > 0) {
          // Try to find a good default voice (prefer "Rachel" or first premade voice)
          const defaultVoice = data.voices.find((v: Voice) => v.name === 'Rachel') 
            || data.voices.find((v: Voice) => v.category === 'premade')
            || data.voices[0];
          if (defaultVoice) {
            setVoice(defaultVoice.voice_id);
          }
        }
      } else {
        toast({ variant: 'destructive', title: 'Failed to load voices', description: data.error });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load voices', description: error.message });
    }
    setIsLoadingVoices(false);
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Text is empty' });
      return;
    }
    if (!voice) {
      toast({ variant: 'destructive', title: 'Please select a voice' });
      return;
    }
    setIsLoading(true);
    setAudioDataUri(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      const data = await response.json();

      if (response.ok && data.audioDataUri) {
        setAudioDataUri(data.audioDataUri);
        toast({ title: 'Audio Generated', description: 'Your speech is ready to be played.' });
      } else {
        toast({ variant: 'destructive', title: 'Generation Failed', description: data.error });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    }
    setIsLoading(false);
  };

  // Group voices by category
  const groupedVoices = voices.reduce((acc, v) => {
    const category = v.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(v);
    return acc;
  }, {} as Record<string, Voice[]>);

  const categoryLabels: Record<string, string> = {
    premade: 'Premium Voices',
    cloned: 'Your Cloned Voices',
    generated: 'Generated Voices',
    professional: 'Professional Voices',
    other: 'Other Voices',
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Text-to-Speech Generator</CardTitle>
          <CardDescription>
            Use ElevenLabs AI to convert your text into natural-sounding speech. Choose from premium voices or your cloned voices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="tts-text">Text to Synthesize</Label>
              <Textarea
                id="tts-text"
                placeholder="Enter the text you want to convert to speech..."
                className="min-h-48"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-voice">Voice</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchVoices}
                  disabled={isLoadingVoices}
                  className="h-6 px-2"
                >
                  <RefreshCw className={`size-3 ${isLoadingVoices ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <Select value={voice} onValueChange={setVoice} disabled={isLoading || isLoadingVoices}>
                <SelectTrigger id="tts-voice">
                  <SelectValue placeholder={isLoadingVoices ? 'Loading voices...' : 'Select a voice'} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedVoices).map(([category, categoryVoices]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {categoryLabels[category] || category}
                      </div>
                      {categoryVoices.map((v) => (
                        <SelectItem key={v.voice_id} value={v.voice_id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {voices.length} voices available
              </p>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading || !voice} className="w-full">
            {isLoading ? <LoaderCircle className="animate-spin" /> : <Wand2 />}
            {isLoading ? 'Generating Audio...' : 'Weave Voice'}
          </Button>
        </CardContent>
      </Card>

      {(isLoading || audioDataUri) && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Audio</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <LoaderCircle className="size-12 animate-spin text-primary" />
                <h3 className="text-xl font-semibold">Synthesizing voice...</h3>
                <p className="text-muted-foreground">This may take a moment. Please wait.</p>
              </div>
            ) : (
              audioDataUri && (
                <div className="w-full space-y-4">
                    <audio controls src={audioDataUri} className="w-full">
                        Your browser does not support the audio element.
                    </audio>
                    <Button asChild variant="outline" className="w-full">
                        <a href={audioDataUri} download="generated-speech.mp3">
                            <AudioLines /> Download MP3
                        </a>
                    </Button>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
