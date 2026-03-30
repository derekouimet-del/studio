'use client';

import { useRecentActivities, formatTimeAgo } from '@/lib/activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  Network,
  Globe,
  Search,
  ScanLine,
  Bot,
  Hammer,
  DatabaseZap,
  ShieldAlert,
  Filter,
  FileSearch,
  AudioLines,
  Radar,
  Fingerprint,
  Clock,
  ArrowRight,
  History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Network,
  Globe,
  Search,
  ScanLine,
  Bot,
  Hammer,
  DatabaseZap,
  ShieldAlert,
  Filter,
  FileSearch,
  AudioLines,
  Radar,
  Fingerprint,
};

function EmptyActivityCard({ index }: { index: number }) {
  return (
    <Card className="relative overflow-hidden border-dashed opacity-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Activity Slot {index + 1}
        </CardTitle>
        <History className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold text-muted-foreground">No activity yet</div>
        <p className="text-xs text-muted-foreground">Use a tool to see it here</p>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: { 
  id: string;
  toolId: string;
  toolName: string;
  toolIcon: string;
  target?: string;
  summary?: string;
  timestamp: number;
  href: string;
}}) {
  const Icon = iconMap[activity.toolIcon] || Network;
  
  return (
    <Link href={activity.href} className="block group">
      <Card className="relative overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate pr-2">
            {activity.toolName}
          </CardTitle>
          <Icon className="h-4 w-4 text-primary shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold truncate">
            {activity.target || activity.summary || 'View results'}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(activity.timestamp)}
            </p>
            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RecentActivityCards() {
  const { activities, isLoading } = useRecentActivities();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-6 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Fill remaining slots with empty cards
  const displayItems = [...activities];
  while (displayItems.length < 4) {
    displayItems.push(null as unknown as typeof activities[0]);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayItems.map((activity, index) => 
        activity ? (
          <ActivityCard key={activity.id} activity={activity} />
        ) : (
          <EmptyActivityCard key={`empty-${index}`} index={index} />
        )
      )}
    </div>
  );
}
