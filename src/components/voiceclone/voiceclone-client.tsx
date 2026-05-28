'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  LoaderCircle, 
  Upload, 
  X, 
  Mic2, 
  CheckCircle2, 
  AudioLines,
  FileAudio,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AudioFile {
  file: File;
  dataUri: string;
}

export function VoiceCloneClient() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [description, setDescription] = useState('');
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AudioFile[] = [];
    
    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast({ 
          variant: 'destructive', 
          title: 'Invalid file type', 
          description: `${file.name} is not an audio file.` 
        });
        continue;
      }

      // Read file as data URI
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newFiles.push({ file, dataUri });
    }

    setAudioFiles((prev) => [...prev, ...newFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClone = async () => {
    if (!voiceName.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a voice name' });
      return;
    }
    
    if (audioFiles.length === 0) {
      toast({ variant: 'destructive', title: 'Please upload at least one audio file' });
      return;
    }

    setIsLoading(true);
    setClonedVoiceId(null);

    try {
      console.log('[v0] Starting voice clone request...');
      const response = await fetch('/api/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: voiceName.trim(),
          description: description.trim() || undefined,
          audioFiles: audioFiles.map((f) => ({
            data: f.dataUri,
            filename: f.file.name,
          })),
        }),
      });
      
      console.log('[v0] Response status:', response.status);
      console.log('[v0] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('[v0] Response text:', responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[v0] JSON parse error:', parseError);
        console.error('[v0] Raw response:', responseText);
        toast({ 
          variant: 'destructive', 
          title: 'Cloning Failed', 
          description: `Invalid response from server: ${responseText.substring(0, 100)}` 
        });
        setIsLoading(false);
        return;
      }

      if (response.ok && data.voice_id) {
        setClonedVoiceId(data.voice_id);
        toast({ 
          title: 'Voice Cloned Successfully', 
          description: `Your voice "${voiceName}" is now ready to use.` 
        });
      } else {
        toast({ variant: 'destructive', title: 'Cloning Failed', description: data.error || 'Unknown error' });
      }
    } catch (error: any) {
      console.error('[v0] Fetch error:', error);
      toast({ variant: 'destructive', title: 'Cloning Failed', description: error.message });
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setVoiceName('');
    setDescription('');
    setAudioFiles([]);
    setClonedVoiceId(null);
  };

  // Calculate total duration estimate (rough estimate based on file size)
  const totalSizeKb = audioFiles.reduce((sum, f) => sum + f.file.size / 1024, 0);
  const estimatedMinutes = Math.round(totalSizeKb / 150); // Very rough estimate

  if (clonedVoiceId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="rounded-full bg-green-500/10 p-4">
            <CheckCircle2 className="size-16 text-green-500" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Voice Cloned Successfully!</h2>
            <p className="text-muted-foreground">
              Your voice &quot;{voiceName}&quot; has been created and is ready to use.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/voiceweaver">
                <AudioLines className="mr-2" />
                Use Voice in Voice Weaver
              </Link>
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Clone Another Voice
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic2 className="size-6" />
            Voice Clone
          </CardTitle>
          <CardDescription>
            Create a custom AI voice clone from audio samples. Upload clear recordings of the voice you want to clone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>Tips for best results</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Use 1-3 minutes of clear, high-quality audio</li>
                <li>Minimize background noise and music</li>
                <li>Use consistent speaking voice throughout</li>
                <li>Supported formats: MP3, WAV, M4A, FLAC</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="voice-name">Voice Name *</Label>
            <Input
              id="voice-name"
              placeholder="Enter a name for this voice..."
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-description">Description (optional)</Label>
            <Textarea
              id="voice-description"
              placeholder="Add a description to help identify this voice..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Audio Samples *</Label>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              <Upload className="size-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click to upload audio files</p>
              <p className="text-xs text-muted-foreground mt-1">
                or drag and drop
              </p>
            </div>
          </div>

          {audioFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files ({audioFiles.length})</Label>
              <div className="space-y-2">
                {audioFiles.map((audioFile, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                  >
                    <FileAudio className="size-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{audioFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(audioFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <audio
                      src={audioFile.dataUri}
                      controls
                      className="h-8 w-32 shrink-0"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                      className="shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {estimatedMinutes > 0 && (
                <p className="text-xs text-muted-foreground">
                  Estimated audio duration: ~{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleClone}
            disabled={isLoading || !voiceName.trim() || audioFiles.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin mr-2" />
                Cloning Voice...
              </>
            ) : (
              <>
                <Mic2 className="mr-2" />
                Clone Voice
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
