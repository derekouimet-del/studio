'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  UploadCloud,
  Layers,
  Sparkles,
  Scissors,
  Download,
  FileText,
  Plus,
  BrainCircuit,
  LoaderCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { suggestWordlistAction } from '@/app/actions';

const leetMap: { [key: string]: string } = {
  a: '4', A: '4',
  e: '3', E: '3',
  g: '6', G: '6',
  i: '1', I: '1',
  o: '0', O: '0',
  s: '5', S: '5',
  t: '7', T: '7',
};

export function WordForgeClient() {
  const [words, setWords] = useState<string[]>([]);
  const [fileName, setFileName] = useState('custom-wordlist.txt');
  const [isDragging, setIsDragging] = useState(false);
  const [minLength, setMinLength] = useState(8);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const wordCount = useMemo(() => words.length, [words]);

  const handleFileRead = (file: File, combine: boolean) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newWords = content.split(/\s+/).filter(Boolean);
      setWords((prev) => (combine ? [...new Set([...prev, ...newWords])] : newWords));
      if (!combine) {
        setFileName(file.name.replace('.txt', '-edited.txt'));
      }
      toast({
        title: 'Wordlist Loaded',
        description: `${newWords.length} words added. Total: ${
          combine ? words.length + newWords.length : newWords.length
        } words.`,
      });
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Error Reading File',
        description: 'Could not read the selected file.',
      });
    };
    reader.readAsText(file);
  };

  const handleFiles = (files: FileList | null, combine: boolean) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.type === 'text/plain') {
        handleFileRead(file, combine);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: `Skipping '${file.name}'. Please upload .txt files only.`,
        });
      }
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, combine: boolean) => {
    handleFiles(e.target.files, combine);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const isCombine = e.shiftKey || words.length > 0;
    handleFiles(e.dataTransfer.files, isCombine);
    if(words.length === 0) {
        toast({ description: 'Hold SHIFT while dropping to combine multiple lists on first upload.'});
    }
  };

  const removeDuplicates = () => {
    const originalCount = words.length;
    const uniqueWords = [...new Set(words)];
    const newCount = uniqueWords.length;
    setWords(uniqueWords);
    toast({
      title: 'Duplicates Removed',
      description: `${originalCount - newCount} duplicate words were removed.`,
    });
  };

  const trimByLength = () => {
    const originalCount = words.length;
    const trimmedWords = words.filter((w) => w.length >= minLength);
    setWords(trimmedWords);
    toast({
      title: 'Wordlist Trimmed',
      description: `${
        originalCount - trimmedWords.length
      } words shorter than ${minLength} characters removed.`,
    });
  };

  const applyCapitalization = (type: 'upper' | 'lower' | 'capitalize') => {
    let transformedWords: string[] = [];
    let title = '';
    if (type === 'upper') {
      transformedWords = words.map((w) => w.toUpperCase());
      title = 'Converted to UPPERCASE';
    } else if (type === 'lower') {
      transformedWords = words.map((w) => w.toLowerCase());
      title = 'Converted to lowercase';
    } else {
      transformedWords = words.map(
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      );
      title = 'Capitalized Words';
    }
    setWords(transformedWords);
    toast({ title });
  };
  
  const applyAffix = (type: 'prefix' | 'suffix') => {
    const affix = type === 'prefix' ? prefix : suffix;
    if (!affix) return;
    const transformed = words.map(w => type === 'prefix' ? `${affix}${w}` : `${w}${affix}`);
    setWords(transformed);
    toast({ title: `Applied ${type}`, description: `Added "${affix}" to ${words.length} words.`});
  }

  const applyLeetSpeak = (checked: boolean) => {
    if (!checked) return; // This function is for applying, not reverting
    const transformed = words.map(w => w.split('').map(char => leetMap[char] || char).join(''));
    setWords(transformed);
    toast({ title: 'Leet Speak Applied', description: 'Converted applicable characters to 1337.'});
  }
  
  const handleGetSuggestions = async () => {
    if (!aiTopic) {
        toast({ variant: 'destructive', title: 'Topic is empty', description: 'Please enter a topic for suggestions.' });
        return;
    }
    setIsSuggesting(true);
    setAiSuggestions([]);
    const response = await suggestWordlistAction({ topic: aiTopic, count: 15 });
    if (response.success && response.data) {
        setAiSuggestions(response.data.suggestions);
    } else {
        toast({ variant: 'destructive', title: 'Suggestion Failed', description: response.error });
    }
    setIsSuggesting(false);
  };
  
  const addSuggestionsToList = () => {
    const newWords = [...words, ...aiSuggestions];
    const uniqueWords = [...new Set(newWords)];
    setWords(uniqueWords);
    toast({ title: 'Suggestions Added', description: `${aiSuggestions.length} new words added to the list.`});
    setAiSuggestions([]);
  };

  const handleDownload = () => {
    if (words.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Wordlist is empty',
        description: 'There is nothing to download.',
      });
      return;
    }
    const blob = new Blob([words.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Download Started', description: `Downloading ${fileName}` });
  };

  return (
    <div className="space-y-8">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border-2 border-dashed transition-colors',
          isDragging ? 'border-primary bg-primary/10' : 'border-border'
        )}
      >
        <UploadCloud className="size-12 text-muted-foreground" />
        <p className="text-center text-muted-foreground">
          Drag & drop your .txt wordlists here or use the buttons below.
          <br />
          <span className="text-xs font-semibold">(Hold SHIFT while dropping to combine lists)</span>
        </p>
        <div className="flex gap-4">
          <Button onClick={() => {
            const el = fileInputRef.current;
            if(el) {
                el.onclick = (e: any) => { (e.target as HTMLInputElement).value = '' };
                el.onchange = (e: any) => onFileSelect(e, false);
                el.click();
            }
          }}>
            <FileText />
            Upload New List
          </Button>
          <Button onClick={() => {
            const el = fileInputRef.current;
             if(el) {
                el.onclick = (e: any) => { (e.target as HTMLInputElement).value = '' };
                el.onchange = (e: any) => onFileSelect(e, true);
                el.click();
            }
          }} variant="secondary" disabled={wordCount === 0}>
            <Layers />
            Combine with List
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".txt,text/plain"
          className="hidden"
        />
      </div>

      {wordCount > 0 && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Manipulation Tools</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Tools */}
                <div className="space-y-2">
                  <Label>Basic Operations</Label>
                  <div className="grid sm:grid-cols-2 gap-2">
                     <Button variant="outline" onClick={removeDuplicates}><Sparkles /> Remove Duplicates</Button>
                     <div className="flex gap-2">
                        <Input type="number" value={minLength} onChange={e => setMinLength(parseInt(e.target.value))} className="w-20" />
                        <Button variant="outline" className="flex-1" onClick={trimByLength}><Scissors /> Trim by Length</Button>
                     </div>
                  </div>
                </div>
                 <Separator />
                {/* Capitalization */}
                <div className="space-y-2">
                    <Label>Capitalization & Case</Label>
                    <div className="grid sm:grid-cols-3 gap-2">
                        <Button variant="outline" onClick={() => applyCapitalization('lower')}>lowercase</Button>
                        <Button variant="outline" onClick={() => applyCapitalization('upper')}>UPPERCASE</Button>
                        <Button variant="outline" onClick={() => applyCapitalization('capitalize')}>Capitalize</Button>
                    </div>
                </div>
                 <Separator />
                {/* Affixes */}
                <div className="space-y-2">
                    <Label>Prefixes & Suffixes</Label>
                    <div className="flex gap-2">
                        <Input placeholder="Prefix..." value={prefix} onChange={e => setPrefix(e.target.value)} />
                        <Button onClick={() => applyAffix('prefix')}><Plus/>Add</Button>
                    </div>
                     <div className="flex gap-2">
                        <Input placeholder="Suffix..." value={suffix} onChange={e => setSuffix(e.target.value)} />
                        <Button onClick={() => applyAffix('suffix')}><Plus/>Add</Button>
                    </div>
                </div>
                 <Separator />
                 {/* Mangling */}
                 <div className="space-y-2">
                    <Label>Mangling Rules</Label>
                    <div className="flex items-center space-x-2 p-2 rounded-md border">
                        <Switch id="leet-speak" onCheckedChange={applyLeetSpeak} />
                        <Label htmlFor="leet-speak">Apply Leet (1337) Speak</Label>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Wordlist Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Word Count</span>
                        <span className="text-2xl font-bold font-code">{wordCount.toLocaleString()}</span>
                    </div>
                     <div className="flex flex-col space-y-2">
                        <Label htmlFor="filename">Download Filename</Label>
                        <Input id="filename" value={fileName} onChange={e => setFileName(e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={handleDownload}><Download/> Download List</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="text-primary" /> AI Suggestions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ai-topic">Topic</Label>
                        <div className="flex items-center space-x-2">
                            <Input 
                                id="ai-topic" 
                                placeholder="e.g., Company name, target hobbies..."
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                disabled={isSuggesting}
                            />
                            <Button onClick={handleGetSuggestions} disabled={isSuggesting || !aiTopic} size="icon">
                                {isSuggesting ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                            </Button>
                        </div>
                    </div>
                    {isSuggesting && (
                         <div className="flex items-center justify-center p-4 space-x-2 text-muted-foreground">
                            <LoaderCircle className="animate-spin size-4" />
                            <span>Generating ideas...</span>
                        </div>
                    )}
                    {aiSuggestions.length > 0 && (
                        <div className="space-y-2">
                            <Label>Generated Words</Label>
                            <div className="font-code text-sm space-y-1 p-2 rounded-md bg-muted/50 max-h-32 overflow-y-auto border">
                                {aiSuggestions.map((w,i) => <p key={i}>{w}</p>)}
                            </div>
                            <Button onClick={addSuggestionsToList} className="w-full"><Plus/> Add Suggestions to List</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Preview</CardTitle><CardDescription>First 10 words</CardDescription></CardHeader>
                <CardContent>
                    <div className="font-code text-sm space-y-1 p-2 rounded-md bg-muted/50 max-h-48 overflow-y-auto">
                        {words.slice(0, 10).map((w,i) => <p key={i}>{w}</p>)}
                        {words.length > 10 && <p>...</p>}
                    </div>
                </CardContent>
             </Card>
          </div>
        </div>
      )}
    </div>
  );
}
