'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ExternalLink, Coffee, Send, Sparkles, Github, Twitter, Linkedin, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';

const projects = [
  {
    name: 'Flock-U',
    description: 'Real-time social network visualization and OSINT tool. Track influence, map connections, and analyze social dynamics.',
    url: 'https://flock-u.com',
    logo: '/logos/flock-u.png',
    tags: ['OSINT', 'SOCIAL', 'ANALYTICS'],
    featured: true,
  },
  {
    name: 'Pen-Quest',
    description: 'AI-powered penetration testing toolkit with reconnaissance, vulnerability assessment, and exploitation tools.',
    url: '/',
    logo: '/logos/penquest.png',
    tags: ['SECURITY', 'AI', 'RECON'],
    isInternal: true,
  },
  {
    name: 'Whisper',
    description: 'Private, encrypted image sharing with end-to-end security. Your moments, protected.',
    url: 'https://whisper.pics',
    logo: '/logos/whisper.png',
    tags: ['PRIVACY', 'ENCRYPTED', 'SECURE'],
  },
  {
    name: 'CamFeed',
    description: 'Comprehensive IP camera suite for monitoring, management, and analysis across multiple feeds.',
    url: 'https://camfeed.click',
    logo: '/logos/camfeed.png',
    tags: ['SURVEILLANCE', 'MONITORING', 'FEEDS'],
  },
  {
    name: 'Product Valuation',
    description: 'AI-powered product valuation tool. Get instant market analysis and pricing insights.',
    url: 'https://v0.app/projects/prj_ABa7xRGNesjAo7koweGxobEmAywH',
    logo: '/logos/product-val.png',
    tags: ['AI', 'VALUATION', 'MARKET'],
  },
  {
    name: 'AI Companion',
    description: 'Your personal AI assistant with memory, personality, and emotional intelligence.',
    url: 'https://v0.app/projects/prj_3aobKiw2WbxMBjYVr6NIYIxrPhXj',
    logo: '/logos/ai-companion.png',
    tags: ['AI', 'COMPANION', 'CHAT'],
  },
];

const skills = [
  'AI Development',
  'Security Research',
  'Full-Stack Engineering',
  'Identity Protection',
  'Voice Synthesis',
  'Penetration Testing',
];

export default function AboutPage() {
  const [suggestion, setSuggestion] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;
    
    setIsSubmitting(true);
    // Simulate submission - in production, this would send to your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Suggestion received!',
      description: 'Thanks for your input. I\'ll review it soon.',
    });
    
    setSuggestion('');
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <>
      <Header title="About Me" />
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          
          {/* Hero Section */}
          <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="relative">
                  <div className="size-32 md:size-40 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 p-1">
                    <div className="size-full rounded-full bg-card flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-bold text-accent">DO</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-accent flex items-center justify-center">
                    <Sparkles className="size-4 text-accent-foreground" />
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <p className="text-accent font-medium tracking-widest text-sm mb-2">AI OPPORTUNIST</p>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">Derek Ouimet</h1>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                    Pioneering the next frontier of digital autonomy. I build tools that empower 
                    creators and protect human identity in an era of rapid AI evolution.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-6 justify-center md:justify-start">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-secondary/50 hover:bg-secondary/70">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-3 mt-6 justify-center md:justify-start">
                    <Button variant="outline" size="icon" asChild className="rounded-full hover:border-accent hover:text-accent">
                      <Link href="https://github.com/derekouimet" target="_blank" rel="noopener noreferrer">
                        <Github className="size-5" />
                        <span className="sr-only">GitHub</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild className="rounded-full hover:border-accent hover:text-accent">
                      <Link href="https://twitter.com/derekouimet" target="_blank" rel="noopener noreferrer">
                        <Twitter className="size-5" />
                        <span className="sr-only">Twitter</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild className="rounded-full hover:border-accent hover:text-accent">
                      <Link href="https://linkedin.com/in/derekouimet" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="size-5" />
                        <span className="sr-only">LinkedIn</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              My Projects
              <span className="text-accent">_</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.name} 
                  className={`group relative overflow-hidden border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 ${project.featured ? 'ring-2 ring-accent/30 border-accent/30' : ''}`}
                >
                  {project.featured && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-accent text-accent-foreground text-xs gap-1">
                        <Star className="size-3 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="size-16 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center overflow-hidden p-1">
                        <Image
                          src={project.logo}
                          alt={`${project.name} logo`}
                          width={56}
                          height={56}
                          className="rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-xl font-bold text-accent">${project.name.slice(0, 2).toUpperCase()}</span>`;
                            }
                          }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-accent transition-colors">
                          {project.name.includes('AI') ? (
                            <>
                              {project.name.split('AI')[0]}
                              <span className="text-accent">AI</span>
                              {project.name.split('AI')[1]}
                            </>
                          ) : (
                            project.name
                          )}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">
                      {project.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs border-border/50 text-muted-foreground"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between group-hover:bg-accent/10 group-hover:text-accent"
                      asChild
                    >
                      {project.isInternal ? (
                        <Link href={project.url}>
                          <span>Explore</span>
                          <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      ) : (
                        <Link href={project.url} target="_blank" rel="noopener noreferrer">
                          <span>Visit Project</span>
                          <ExternalLink className="size-4" />
                        </Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bottom Row: Suggestions + Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Suggestion Box */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <MessageSquarePlus className="size-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">What Should I Build Next?</CardTitle>
                    <CardDescription>Got an idea for a tool or feature? Let me know!</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                  <Textarea
                    placeholder="I'd love to see a tool that..."
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    className="min-h-[120px] resize-none bg-secondary/30 border-border/50 focus:border-accent"
                  />
                  <Input
                    type="email"
                    placeholder="Your email (optional - for follow-up)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/30 border-border/50 focus:border-accent"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={!suggestion.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="size-4" />
                        Submit Suggestion
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Support / Buy Me a Coffee */}
            <Card className="border-border/50 bg-gradient-to-br from-card to-amber-950/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Coffee className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Support My Work</CardTitle>
                    <CardDescription>Help fuel the next innovation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Building these tools takes countless hours of research, development, and coffee. 
                  If you find my work valuable, consider buying me a coffee to keep the creativity flowing.
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    asChild
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium"
                  >
                    <Link href="https://buymeacoffee.com/derekouimet" target="_blank" rel="noopener noreferrer">
                      <Coffee className="size-4 mr-2" />
                      Buy Me a Coffee
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  <Button 
                    variant="outline" 
                    asChild
                    className="w-full border-accent/50 hover:bg-accent/10 hover:text-accent hover:border-accent"
                  >
                    <Link href="https://github.com/sponsors/derekouimet" target="_blank" rel="noopener noreferrer">
                      <Github className="size-4 mr-2" />
                      Sponsor on GitHub
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Quote */}
          <div className="text-center py-8">
            <p className="text-muted-foreground italic">
              &ldquo;Building the tools I wish existed, one <span className="text-accent">AI</span> at a time.&rdquo;
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
