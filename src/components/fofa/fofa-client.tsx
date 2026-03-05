'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, LoaderCircle, Search, Copy, Check, ExternalLink } from 'lucide-react';
import { fofaSuggestionAction } from '@/app/actions';
import { ChatBubble } from '@/components/agent/chat-bubble';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'model';
  content: string;
  query?: string | null;
};

export function FofaForgeClient() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hi! I'm Nexus. I can help you build advanced FOFA search queries. Just tell me what you're looking for, like 'Find Apache servers in the UK with port 8080'.",
    },
  ]);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForAI = messages.map(m => ({ role: m.role, content: m.content }));

    const response = await fofaSuggestionAction({
      history: historyForAI,
      message: input,
    });

    if (response.success && response.data) {
      const modelMessage: Message = { 
        role: 'model', 
        content: response.data.response,
        query: response.data.query
      };
      setMessages((prev) => [...prev, modelMessage]);
    } else {
      const errorMessage: Message = {
        role: 'model',
        content: "I'm sorry, I'm having trouble connecting to the logic core. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const copyToClipboard = (query: string) => {
    navigator.clipboard.writeText(query);
    setHasCopied(query);
    toast({ title: 'Query copied to clipboard' });
    setTimeout(() => setHasCopied(null), 2000);
  };

  return (
    <Card className="flex flex-col h-[75vh]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Search className="text-primary"/> FofaForge Query Builder</CardTitle>
        <CardDescription>Nexus will translate your search intent into specialized FOFA syntax. Use double-quotes for exact string matching in queries.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-6 pb-4">
          <div className="space-y-6 pr-4 py-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-3">
                <ChatBubble role={message.role} content={message.content} />
                {message.role === 'model' && message.query && (
                  <div className="ml-12 flex flex-col gap-2">
                    <div className="bg-card p-4 rounded-md font-code text-sm border relative group overflow-x-auto">
                      <pre><code>{message.query}</code></pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => copyToClipboard(message.query!)}
                      >
                        {hasCopied === message.query ? <Check className="text-green-500 h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="text-xs h-7">
                            <a href={`https://fofa.info/result?qbase64=${Buffer.from(message.query).toString('base64')}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" /> View on FOFA
                            </a>
                        </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted ml-12">
                  <LoaderCircle className="animate-spin size-4" />
                  <span className="text-sm text-muted-foreground">Nexus is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-2 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="e.g., search for exposed Jenkins servers in Germany"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading}>
              <Send />
              <span className="sr-only">Send Message</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
