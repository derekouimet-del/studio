'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ScanLine,
  Bot,
  FileText,
  Hammer,
  TerminalSquare,
  ShieldAlert,
  FileSearch,
  Fingerprint,
  Tag,
  Globe,
  DatabaseZap,
  Users,
  AudioLines,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { PenQuestLogo } from '@/components/icons';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/attack-surface', icon: Globe, label: 'Attack Surface' },
  { href: '/scan', icon: ScanLine, label: 'Network Scan' },
  { href: '/scanweaver', icon: TerminalSquare, label: 'ScanWeaver' },
  { href: '/crawl', icon: Bot, label: 'Web Crawler' },
  { href: '/google-recon', icon: FileSearch, label: 'Google Recon' },
  { href: '/vulndb-explorer', icon: DatabaseZap, label: 'VulnDB Explorer' },
  { href: '/default-pass', icon: Users, label: 'Default Pass' },
  { href: '/breach-inspector', icon: ShieldAlert, label: 'Breach Inspector' },
  { href: '/wordforge', icon: Hammer, label: 'WordForge' },
  { href: '/synthalyzer', icon: Fingerprint, label: 'Synthalyzer' },
  { href: '/voiceweaver', icon: AudioLines, label: 'Voice Weaver' },
  { href: '/metaview', icon: Tag, label: 'MetaView' },
  { href: '/reports', icon: FileText, label: 'Reports' },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <PenQuestLogo className="size-8 text-primary" />
          <h2 className="text-xl font-semibold uppercase tracking-wider">Pen-Quest</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
