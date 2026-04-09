'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { oracleAction, textToSpeechAction } from '@/app/actions';
import { LoaderCircle, Send, Mic, MicOff, Trash2, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = 'You are a helpful assistant. Be concise, clear, and practical.';

const voices = [
  { id: 'Algenib', name: 'Algenib (Male, US)' },
  { id: 'Achernar', name: 'Achernar (Female, US)' },
  { id: 'Spica', name: 'Spica (Female, US)' },
  { id: 'Antares', name: 'Antares (Male, US)' },
  { id: 'Sirius', name: 'Sirius (Male, UK)' },
  { id: 'Canopus', name: 'Canopus (Female, UK)' },
];

export function OracleClient() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Algenib');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const handleSubmit = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await oracleAction({ messages: newMessages });

      if (response.success && response.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Generate audio response if enabled
        if (audioEnabled && response.data.response) {
          setIsGeneratingAudio(true);
          try {
            const audioResponse = await textToSpeechAction({
              text: response.data.response,
              voice: selectedVoice,
            });

            if (audioResponse.success && audioResponse.data) {
              const audio = new Audio(audioResponse.data.audioDataUri);
              setCurrentAudio(audio);
              setIsPlayingAudio(true);
              
              audio.onended = () => {
                setIsPlayingAudio(false);
              };
              
              audio.play().catch((err) => {
                console.error('Audio playback failed:', err);
                setIsPlayingAudio(false);
              });
            }
          } catch (audioError) {
            console.error('Audio generation failed:', audioError);
          } finally {
            setIsGeneratingAudio(false);
          }
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Oracle Error',
          description: response.error || 'Failed to get a response.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        
        // Transcribe the audio using browser's Speech Recognition API
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: 'Recording started', description: 'Speak now...' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access the microphone. Please check permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // Use the Web Speech API for transcription
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Unavailable',
        description: 'Your browser does not support speech recognition.',
      });
      return;
    }

    toast({ title: 'Processing...', description: 'Transcribing your speech.' });
  };

  // Alternative: Use Web Speech API directly for live transcription
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Unavailable',
        description: 'Your browser does not support speech recognition.',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-submit after transcription
      handleSubmit(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast({
        variant: 'destructive',
        title: 'Speech Recognition Error',
        description: `Error: ${event.error}`,
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }, [toast]);

  const clearHistory = () => {
    setMessages([{ role: 'system', content: SYSTEM_PROMPT }]);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlayingAudio(false);
    }
    toast({ title: 'History Cleared', description: 'Conversation has been reset.' });
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingAudio(false);
    }
  };

  const visibleMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Oracle AI Assistant</CardTitle>
          <CardDescription>
            Ask the Oracle anything. Use the microphone to speak your question, and enable audio response to hear the answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Settings Row */}
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Switch
                id="audio-toggle"
                checked={audioEnabled}
                onCheckedChange={setAudioEnabled}
              />
              <Label htmlFor="audio-toggle" className="flex items-center gap-2 cursor-pointer">
                {audioEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                Audio Response
              </Label>
            </div>
            
            {audioEnabled && (
              <div className="flex items-center gap-2">
                <Label htmlFor="voice-select" className="text-sm text-muted-foreground">Voice:</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger id="voice-select" className="w-48">
                    <SelectValue placeholder="Select voice" />
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
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="ml-auto"
            >
              <Trash2 className="size-4" />
              Clear History
            </Button>
          </div>

          {/* Terminal-style Chat Area */}
          <div className="rounded-lg border bg-background font-mono text-sm">
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
              <div className="size-3 rounded-full bg-red-500" />
              <div className="size-3 rounded-full bg-yellow-500" />
              <div className="size-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-muted-foreground">Oracle Terminal</span>
              {isPlayingAudio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopAudio}
                  className="ml-auto h-6 px-2"
                >
                  <StopCircle className="size-3 mr-1" />
                  Stop Audio
                </Button>
              )}
            </div>
            
            <ScrollArea ref={scrollAreaRef} className="h-96 p-4">
              <div className="space-y-4">
                {visibleMessages.length === 0 && (
                  <div className="text-muted-foreground">
                    <p>Oracle ready.</p>
                    <p>Type your question below or use the microphone.</p>
                  </div>
                )}
                
                {visibleMessages.map((message, index) => (
                  <div key={index} className="space-y-1">
                    {message.role === 'user' ? (
                      <div>
                        <span className="text-primary">{'>'}</span>{' '}
                        <span className="text-foreground">{message.content}</span>
                      </div>
                    ) : (
                      <div className="pl-4 text-muted-foreground whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    <span>Oracle is thinking...</span>
                  </div>
                )}

                {isGeneratingAudio && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    <span>Generating audio response...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startSpeechRecognition}
              disabled={isLoading}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </Button>
            
            <Input
              ref={inputRef}
              placeholder="Ask the Oracle something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isRecording}
              className="flex-1 font-mono"
            />
            
            <Button
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim() || isRecording}
            >
              {isLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
