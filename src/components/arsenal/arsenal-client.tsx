'use client';

import { useState, useMemo, useEffect } from 'react';
import { tutorials, Tutorial } from '@/lib/tutorials';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Library } from 'lucide-react';
import { cn } from '@/lib/utils';

// Basic styling for prose-like content since we don't have typography plugin
const proseStyles = `
.prose h1 { font-size: 2.25rem; line-height: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
.prose h2 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 0.5rem; }
.prose h3 { font-size: 1.5rem; line-height: 2rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
.prose p { line-height: 1.75; margin-bottom: 1rem; }
.prose code { background-color: hsl(var(--muted)); color: hsl(var(--foreground)); padding: 0.2rem 0.4rem; font-size: 0.9em; border-radius: 0.25rem; font-family: var(--font-code); }
.prose pre { background-color: hsl(var(--card)); border: 1px solid hsl(var(--border)); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
.prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
.prose li { margin-bottom: 0.5rem; }
`;

export function ArsenalClient() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const categories = useMemo(() => {
    const grouped: { [key: string]: Tutorial[] } = {};
    tutorials.forEach((tutorial) => {
      if (!grouped[tutorial.category]) {
        grouped[tutorial.category] = [];
      }
      grouped[tutorial.category].push(tutorial);
    });
    return grouped;
  }, []);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = proseStyles;
    document.head.appendChild(styleSheet);
    
    // Cleanup function to remove the style when the component unmounts.
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);


  return (
    <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-10rem)]">
      <Card className="lg:col-span-4 xl:col-span-3">
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>Select a tutorial to begin.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-15rem)]">
            <div className="p-2 space-y-2">
              {Object.entries(categories).map(([category, items]) => (
                <div key={category}>
                  <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {items.map((tutorial) => (
                      <Button
                        key={tutorial.id}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          selectedTutorial?.id === tutorial.id && 'bg-accent'
                        )}
                        onClick={() => setSelectedTutorial(tutorial)}
                      >
                        {tutorial.title}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-8 xl:col-span-9">
        <ScrollArea className="h-full">
            <div className="p-6">
                {selectedTutorial ? (
                    <div className="prose prose-invert max-w-none">
                        <h1 className="text-3xl font-bold mb-2">{selectedTutorial.title}</h1>
                        <p className="text-muted-foreground mb-6">{selectedTutorial.description}</p>
                        <div className="text-foreground whitespace-pre-wrap font-code bg-muted/50 p-6 rounded-lg border">
                            {selectedTutorial.content}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Library className="size-24 text-muted-foreground" />
                        <h2 className="mt-6 text-2xl font-semibold">Welcome to The Arsenal</h2>
                        <p className="mt-2 text-muted-foreground">
                        Your knowledge base for penetration testing techniques and tool guides.
                        <br />
                        Select a tutorial from the left to get started.
                        </p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </Card>
    </div>
  );
}