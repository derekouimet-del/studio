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
import { textToSpeechAction } from '@/app/actions';
import { LoaderCircle, Wand2, AudioLines } from 'lucide-react';

const voices = [
  { id: 'Algenib', name: 'Algenib (Male, US)' },
  { id: 'Achernar', name: 'Achernar (Female, US)' },
  { id: 'Sirius', name: 'Sirius (Male, UK)' },
  { id: 'Canopus', name: 'Canopus (Female, UK)' },
  { id: 'Vega', name: 'Vega (Female, AU)' },
  { id: 'Rigel', name: 'Rigel (Male, AU)' },
];

export function VoiceWeaverClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('Hello, world! This is a test of the text to speech engine.');
  const [voice, setVoice] = useState('Algenib');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Text is empty' });
      return;
    }
    setIsLoading(true);
    setAudioDataUri(null);

    const response = await textToSpeechAction({ text, voice });

    if (response.success && response.data) {
      setAudioDataUri(response.data.audioDataUri);
      toast({ title: 'Audio Generated', description: 'Your speech is ready to be played.' });
    } else {
      toast({ variant: 'destructive', title: 'Generation Failed', description: response.error });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Text-to-Speech Generator</CardTitle>
          <CardDescription>
            Use state-of-the-art AI to convert your text into spoken audio. Choose from a variety of voices.
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
              <Label htmlFor="tts-voice">Voice</Label>
              <Select value={voice} onValueChange={setVoice} disabled={isLoading}>
                <SelectTrigger id="tts-voice">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
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
                        <a href={audioDataUri} download="generated-speech.wav">
                            <AudioLines /> Download WAV
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
