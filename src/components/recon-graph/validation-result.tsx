'use client';

import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle, RotateCw, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { FindingVerification, FindingVerificationStatus } from '@/lib/validation/types';
import { STATUS_CONFIG } from '@/lib/validation/types';
import { cn } from '@/lib/utils';

interface ValidationResultProps {
  verification: FindingVerification | null;
  isLoading: boolean;
  error: string | null;
  onValidate: () => void;
  onRetry: () => void;
}

export function ValidationResult({
  verification,
  isLoading,
  error,
  onValidate,
  onRetry,
}: ValidationResultProps) {
  const getStatusIcon = (status: FindingVerificationStatus) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="size-4" />;
      case 'likely_vulnerable':
        return <AlertTriangle className="size-4" />;
      case 'false_positive_suspected':
        return <XCircle className="size-4" />;
      case 'needs_manual_review':
        return <HelpCircle className="size-4" />;
      case 'detected':
      default:
        return <Info className="size-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-400';
    if (confidence >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-500';
    if (confidence >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Empty state - not yet validated
  if (!verification && !isLoading && !error) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="size-4" />
          Validation
        </h4>
        <p className="text-xs text-muted-foreground">
          Run validation to verify this finding and determine its accuracy.
        </p>
        <Button
          onClick={onValidate}
          size="sm"
          className="w-full"
        >
          <Shield className="size-4 mr-2" />
          Validate Finding
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="size-4" />
          Validation
        </h4>
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <div className="relative">
            <div className="size-10 rounded-full border-2 border-primary/30 animate-pulse" />
            <RotateCw className="size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Validating finding...</p>
          <p className="text-xs text-muted-foreground">Running verification checks</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="size-4" />
          Validation
        </h4>
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="size-4" />
            <span className="text-sm font-medium">Validation Failed</span>
          </div>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button
          onClick={onRetry}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <RotateCw className="size-4 mr-2" />
          Retry Validation
        </Button>
      </div>
    );
  }

  // Success state - show results
  if (!verification) return null;
  
  const statusConfig = STATUS_CONFIG[verification.status];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="size-4" />
          Validation Result
        </h4>
        <Button
          onClick={onValidate}
          size="sm"
          variant="ghost"
          className="h-7 px-2"
        >
          <RotateCw className="size-3 mr-1" />
          Re-run
        </Button>
      </div>

      {/* Status Badge */}
      <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-md', statusConfig.bgColor)}>
        <span className={statusConfig.color}>{getStatusIcon(verification.status)}</span>
        <span className={cn('font-medium text-sm', statusConfig.color)}>{statusConfig.label}</span>
      </div>

      {/* Confidence Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence</span>
          <span className={cn('font-semibold font-mono', getConfidenceColor(verification.confidence))}>
            {verification.confidence}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(verification.confidence))}
            style={{ width: `${verification.confidence}%` }}
          />
        </div>
      </div>

      <Separator />

      {/* Evidence */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Evidence</h5>
        <ul className="space-y-1.5">
          {verification.evidence.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-xs">
              <span className="text-primary mt-1">•</span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      {/* Rationale */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Rationale</h5>
        <p className="text-xs text-muted-foreground leading-relaxed">{verification.rationale}</p>
      </div>

      {/* Remediation */}
      {verification.remediation.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Recommended Actions</h5>
            <ul className="space-y-1.5">
              {verification.remediation.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <span className="text-emerald-400 mt-0.5 font-mono">{index + 1}.</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Timestamp */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Validated: {new Date(verification.checkedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
