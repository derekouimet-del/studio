'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  getRecentActivities, 
  recordActivity as recordActivityService,
  type ToolActivity,
  TOOL_METADATA,
} from './activity-service';

export function useRecentActivities() {
  const [activities, setActivities] = useState<ToolActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setActivities(getRecentActivities());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    
    // Listen for activity updates
    const handleUpdate = () => refresh();
    window.addEventListener('activity-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    return () => {
      window.removeEventListener('activity-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  return { activities, isLoading, refresh };
}

export function useRecordActivity(toolId: string) {
  const record = useCallback((options: { target?: string; summary?: string }) => {
    const metadata = TOOL_METADATA[toolId];
    if (!metadata) return;
    
    recordActivityService({
      toolId,
      toolName: metadata.name,
      toolIcon: metadata.icon,
      href: `/${toolId}`,
      target: options.target,
      summary: options.summary,
    });
  }, [toolId]);

  return { record };
}
