'use client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  command: string;
}

export function CodeBlock({ command }: CodeBlockProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    toast({ title: 'Copied to clipboard!' });
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="bg-card p-4 rounded-md my-2 relative font-code text-sm border">
      <pre><code>{command}</code></pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={copyToClipboard}
      >
        {hasCopied ? <Check className="text-green-500" /> : <Copy />}
        <span className="sr-only">Copy command</span>
      </Button>
    </div>
  );
}
