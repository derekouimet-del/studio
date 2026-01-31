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
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ProSentryLogo } from '@/components/icons';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/scan', icon: ScanLine, label: 'Network Scan' },
  { href: '/crawl', icon: Bot, label: 'Web Crawler' },
  { href: '/scanweaver', icon: TerminalSquare, label: 'ScanWeaver' },
  { href: '/reports', icon: FileText, label: 'Reports' },
  { href: '/wordforge', icon: Hammer, label: 'WordForge' },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ProSentryLogo className="size-8 text-primary" />
          <h2 className="text-xl font-semibold font-headline tracking-tighter">ProSentry</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
