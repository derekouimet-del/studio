'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, LoaderCircle, TerminalSquare } from 'lucide-react';
import { nmapSuggestionAction } from '@/app/actions';
import { ChatBubble } from '@/components/agent/chat-bubble';
import { CodeBlock } from '@/components/scanweaver/code-block';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


type Message = {
  role: 'user' | 'model';
  content: string;
  command?: string | null;
};

export function ScanWeaverClient() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Welcome to ScanWeaver! I can help you build nmap commands. What would you like to scan today? For example, try 'scan my local network for web servers'.",
    },
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const historyForAI = messages.map(m => ({ role: m.role, content: m.content }));

    const response = await nmapSuggestionAction({
      history: historyForAI,
      message: input,
    });

    if (response.success && response.data) {
      const modelMessage: Message = { 
        role: 'model', 
        content: response.data.response,
        command: response.data.command
      };
      setMessages((prev) => [...prev, modelMessage]);
    } else {
      const errorMessage: Message = {
        role: 'model',
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <Card className="flex flex-col h-[75vh]">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><TerminalSquare className="text-primary"/> Nmap AI Assistant</CardTitle>
            <CardDescription>Use natural language to generate and understand nmap commands. The AI can also analyze scan results if you paste them in.</CardDescription>
        </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-6 pb-4">
            <div className="space-y-4 pr-4">
              {messages.map((message, index) => (
                <div key={index}>
                    <ChatBubble role={message.role} content={message.content} />
                    {message.role === 'model' && message.command && (
                        <div className="flex justify-start">
                             <div className="flex items-start gap-2.5 w-full max-w-[80%] ml-10">
                                <CodeBlock command={message.command} />
                             </div>
                        </div>
                    )}
                </div>
              ))}
               {isLoading && (
                <div className="flex justify-start">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted ml-10">
                        <LoaderCircle className="animate-spin size-4" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 pt-2">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="e.g., run a stealth scan on 192.168.1.10"
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
