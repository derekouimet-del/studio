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
  Globe,
  ScanLine,
  Bot,
  Hammer,
  DatabaseZap,
  ArrowRight,
  Search,
  Network,
  ShieldAlert,
} from 'lucide-react';
import { RecentActivityCards } from '@/components/dashboard/recent-activity-cards';

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
        {/* Recent Activity Section */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight mb-4 text-muted-foreground">Recent Activity</h2>
          <RecentActivityCards />
        </div>
        
        {/* Tool Arsenal Section */}
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
