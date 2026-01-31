import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-2.5 max-w-[80%]">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col w-full leading-1.5 p-3 border-border bg-card rounded-e-xl rounded-es-xl">
              <p className="text-sm font-normal text-card-foreground">{content}</p>
            </div>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback><User /></AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2.5 max-w-[80%]">
        <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
            <AvatarFallback><Bot/></AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex flex-col w-full leading-1.5 p-3 border-border bg-muted rounded-e-xl rounded-es-xl">
            <p className="text-sm font-normal text-muted-foreground">{content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
