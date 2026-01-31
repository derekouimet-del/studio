'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, LoaderCircle, Sparkles } from 'lucide-react';
import { agentChatAction } from '@/app/actions';
import { ChatBubble } from '@/components/agent/chat-bubble';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm ProSentry's AI assistant. How can I help you with your penetration testing today?",
    },
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await agentChatAction({
      history: messages,
      message: input,
    });

    if (response.success && response.data) {
      const modelMessage: Message = { role: 'model', content: response.data.response };
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
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="icon" className="rounded-full w-14 h-14 shadow-lg" onClick={() => setIsOpen(true)}>
          <MessageSquare className="w-6 h-6" />
          <span className="sr-only">Open AI Agent</span>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg flex flex-col h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> ProSentry AI Agent</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pr-4">
              {messages.map((message, index) => (
                <ChatBubble key={index} role={message.role} content={message.content} />
              ))}
               {isLoading && (
                <div className="flex justify-start">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                        <LoaderCircle className="animate-spin size-4" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading}>
                <Send />
                <span className="sr-only">Send Message</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
