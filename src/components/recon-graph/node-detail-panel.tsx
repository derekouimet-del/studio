'use client';

import { X, Globe, Server, Cloud, Code, AlertTriangle, Lock, ShieldAlert, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ReconNode, NodeType, RiskLevel } from '@/lib/recon-graph/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NodeDetailPanelProps {
  node: ReconNode | null;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'root':
        return <Globe className="size-5" />;
      case 'subdomain':
        return <Globe className="size-5" />;
      case 'ip':
        return <Server className="size-5" />;
      case 'service':
        return <Cloud className="size-5" />;
      case 'technology':
        return <Code className="size-5" />;
      case 'cve':
        return <AlertTriangle className="size-5" />;
      case 'ssl':
        return <Lock className="size-5" />;
      case 'risk':
        return <ShieldAlert className="size-5" />;
      default:
        return <Globe className="size-5" />;
    }
  };

  const getTypeColor = (type: NodeType) => {
    switch (type) {
      case 'root':
        return 'bg-primary/20 text-primary';
      case 'subdomain':
        return 'bg-blue-500/20 text-blue-400';
      case 'ip':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'service':
        return 'bg-amber-500/20 text-amber-400';
      case 'technology':
        return 'bg-purple-500/20 text-purple-400';
      case 'cve':
        return 'bg-red-500/20 text-red-400';
      case 'ssl':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'risk':
        return 'bg-red-600/20 text-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: RiskLevel): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (risk) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return '';
    }
  };

  const getTypeName = (type: NodeType) => {
    switch (type) {
      case 'root':
        return 'Root Target';
      case 'subdomain':
        return 'Subdomain';
      case 'ip':
        return 'IP Address';
      case 'service':
        return 'Service/Port';
      case 'technology':
        return 'Technology';
      case 'cve':
        return 'CVE';
      case 'ssl':
        return 'SSL Certificate';
      case 'risk':
        return 'Risk Assessment';
      default:
        return type;
    }
  };

  const renderMetadata = () => {
    if (!node.metadata) return null;

    const entries = Object.entries(node.metadata);
    if (entries.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Details</h4>
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start gap-4 text-sm">
              <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={cn(
                "text-foreground text-right max-w-[180px] break-words",
                typeof value === 'number' && key.toLowerCase().includes('score') && 'font-code font-bold',
                typeof value === 'number' && key.toLowerCase().includes('score') && (value as number) >= 9 && 'text-red-400',
                typeof value === 'number' && key.toLowerCase().includes('score') && (value as number) >= 7 && (value as number) < 9 && 'text-red-400',
                typeof value === 'number' && key.toLowerCase().includes('score') && (value as number) >= 4 && (value as number) < 7 && 'text-yellow-400',
                typeof value === 'number' && key.toLowerCase().includes('score') && (value as number) < 4 && 'text-green-400',
              )}>
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCVEActions = () => {
    if (node.type !== 'cve') return null;

    return (
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
          <a 
            href={`https://nvd.nist.gov/vuln/detail/${node.label}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4 mr-2" />
            View on NVD
          </a>
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
          <a 
            href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${node.label}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4 mr-2" />
            View on MITRE
          </a>
        </Button>
      </div>
    );
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-foreground">Node Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Node Type Badge */}
          <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-md', getTypeColor(node.type))}>
            {getNodeIcon(node.type)}
            <span className="font-medium">{getTypeName(node.type)}</span>
          </div>

          {/* Node Label */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Value</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-code break-all">
                {node.label}
              </code>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(node.label)}>
                {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Risk Level */}
          {node.riskLevel && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Risk Level</h4>
              <Badge 
                variant={getRiskBadgeVariant(node.riskLevel)}
                className={cn('uppercase', getRiskColor(node.riskLevel))}
              >
                {node.riskLevel}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          {renderMetadata()}

          {/* CVE Actions */}
          {node.type === 'cve' && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Actions</h4>
                {renderCVEActions()}
              </div>
            </>
          )}

          {/* Raw Data */}
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Raw Data</h4>
            <pre className="p-3 bg-muted rounded-md text-xs font-code overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(node, null, 2)}
            </pre>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
