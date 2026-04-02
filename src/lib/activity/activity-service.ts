// Activity tracking service for recent tool usage

export interface ToolActivity {
  id: string;
  toolId: string;
  toolName: string;
  toolIcon: string;
  target?: string;
  summary?: string;
  timestamp: number;
  href: string;
}

const STORAGE_KEY = 'pen-quest-recent-activity';
const MAX_ACTIVITIES = 4;

// Tool metadata mapping
export const TOOL_METADATA: Record<string, { name: string; icon: string }> = {
  'recon-graph': { name: 'Recon Graph', icon: 'Network' },
  'attack-surface': { name: 'Attack Surface', icon: 'Globe' },
  'fofa': { name: 'FofaForge', icon: 'Search' },
  'scan': { name: 'Network Scan', icon: 'ScanLine' },
  'crawl': { name: 'Web Crawler', icon: 'Bot' },
  'wordforge': { name: 'WordForge', icon: 'Hammer' },
  'vulndb-explorer': { name: 'VulnDB Explorer', icon: 'DatabaseZap' },
  'breach-inspector': { name: 'Breach Inspector', icon: 'ShieldAlert' },
  'cve-monitor': { name: 'CVE Monitor', icon: 'ShieldAlert' },
  'google-recon': { name: 'Google Recon', icon: 'Search' },
  'datasieve': { name: 'DataSieve', icon: 'Filter' },
  'metaview': { name: 'MetaView', icon: 'FileSearch' },
  'synthalyzer': { name: 'Synthalyzer', icon: 'AudioLines' },
  'voiceweaver': { name: 'VoiceWeaver', icon: 'AudioLines' },
  'scanweaver': { name: 'ScanWeaver', icon: 'Radar' },
  'default-pass': { name: 'Default Pass', icon: 'Fingerprint' },
  'threat-view': { name: 'Threat View', icon: 'Radar' },
};

export function getRecentActivities(): ToolActivity[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function recordActivity(activity: Omit<ToolActivity, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const activities = getRecentActivities();
    
    const newActivity: ToolActivity = {
      ...activity,
      id: `${activity.toolId}-${Date.now()}`,
      timestamp: Date.now(),
    };
    
    // Add to beginning and keep only MAX_ACTIVITIES
    const updated = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Dispatch custom event to notify listeners
    window.dispatchEvent(new CustomEvent('activity-updated'));
  } catch (error) {
    console.error('Failed to record activity:', error);
  }
}

export function clearActivities(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('activity-updated'));
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}
