import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Activity,
  ShieldAlert,
  Bot,
  Signal,
  Globe,
  ScanLine,
  Hammer,
  DatabaseZap,
  ArrowRight,
  Search,
  Network,
} from 'lucide-react';

const tools = [
  {
    href: '/recon-graph',
    icon: Network,
    label: 'Recon Graph',
    description: 'Visualize target infrastructure, services, risks, and relationships in an interactive graph.',
  },
  {
    href: '/attack-surface',
    icon: Globe,
    label: 'Attack Surface Mapper',
    description: 'Discover live subdomains and IPs for a target domain.',
  },
  {
    href: '/fofa',
    icon: Search,
    label: 'FofaForge',
    description: 'Build specialized FOFA queries using natural language.',
  },
  {
    href: '/scan',
    icon: ScanLine,
    label: 'Network Scan',
    description: 'Scan hosts for open ports, services, and vulnerabilities.',
  },
  {
    href: '/crawl',
    icon: Bot,
    label: 'Web Crawler',
    description: 'Crawl a website to find pages and potential secrets.',
  },
  {
    href: '/wordforge',
    icon: Hammer,
    label: 'WordForge',
    description: 'Create and manipulate custom wordlists for password cracking.',
  },
  {
    href: '/vulndb-explorer',
    icon: DatabaseZap,
    label: 'VulnDB Explorer',
    description: 'Search for known CVEs for any software product.',
  },
  {
    href: '/breach-inspector',
    icon: ShieldAlert,
    label: 'Breach Inspector',
    description: 'Check password strength and generate themed wordlists.',
  },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 grid gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Anomalies Detected
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                in the last 24 hours
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">3</div>
              <p className="text-xs text-muted-foreground">
                High-priority alerts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bandwidth</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2 Gbps</div>
              <p className="text-xs text-muted-foreground">Current network usage</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Monitored</CardTitle>
              <Signal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">Across 12 hosts</p>
            </CardContent>
          </Card>
        </div>
        
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Tool Arsenal</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                    <Card key={tool.href} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <tool.icon className="size-7 text-primary" />
                                {tool.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </CardContent>
                        <CardFooter>
                             <Button asChild className="w-full">
                                <Link href={tool.href}>Launch Tool <ArrowRight /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
