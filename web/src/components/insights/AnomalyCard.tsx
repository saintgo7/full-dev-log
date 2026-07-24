'use client';

import { AlertTriangle, Clock, TrendingUp, Moon, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { Anomaly, AnomalyType, AnomalySeverity } from '@/types';

interface AnomalyCardProps {
  anomaly: Anomaly;
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ANOMALY_ICONS: Record<AnomalyType, React.ReactNode> = {
  unusual_hours: <Moon className="h-4 w-4" />,
  activity_spike: <TrendingUp className="h-4 w-4" />,
  inactivity: <Clock className="h-4 w-4" />,
  pattern_break: <AlertTriangle className="h-4 w-4" />,
};

const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  unusual_hours: 'Unusual Hours',
  activity_spike: 'Activity Spike',
  inactivity: 'Inactivity Period',
  pattern_break: 'Pattern Break',
};

const SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  low: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  medium: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const SEVERITY_BADGES: Record<AnomalySeverity, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
  low: { variant: 'secondary', label: 'Low' },
  medium: { variant: 'default', label: 'Medium' },
  high: { variant: 'destructive', label: 'High' },
};

export function AnomalyCard({ anomaly, onDismiss, isLoading, className }: AnomalyCardProps) {
  const icon = ANOMALY_ICONS[anomaly.type];
  const typeLabel = ANOMALY_TYPE_LABELS[anomaly.type];
  const severityColor = SEVERITY_COLORS[anomaly.severity];
  const severityBadge = SEVERITY_BADGES[anomaly.severity];

  return (
    <Card className={cn('relative', severityColor, className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-full',
                anomaly.severity === 'high' && 'bg-red-500/20',
                anomaly.severity === 'medium' && 'bg-orange-500/20',
                anomaly.severity === 'low' && 'bg-yellow-500/20'
              )}
            >
              {icon}
            </div>
            <div>
              <h4 className="text-sm font-semibold">{anomaly.title}</h4>
              <p className="text-xs text-muted-foreground">{typeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={severityBadge.variant}
              className={cn(
                anomaly.severity === 'low' && 'bg-yellow-500 text-yellow-50',
                anomaly.severity === 'medium' && 'bg-orange-500 text-orange-50',
                anomaly.severity === 'high' && 'bg-red-500 text-red-50'
              )}
            >
              {severityBadge.label}
            </Badge>
            {onDismiss && !anomaly.dismissed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDismiss(anomaly.id)}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
        <p className="text-xs text-muted-foreground">
          Detected: {formatDate(anomaly.detectedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

interface AnomalyListProps {
  anomalies: Anomaly[];
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function AnomalyList({
  anomalies,
  onDismiss,
  isLoading,
  emptyMessage = 'No anomalies detected',
  className,
}: AnomalyListProps) {
  if (anomalies.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Sort by severity (high first) then by date
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });

  return (
    <div className={cn('space-y-3', className)}>
      {sortedAnomalies.map((anomaly) => (
        <AnomalyCard
          key={anomaly.id}
          anomaly={anomaly}
          onDismiss={onDismiss}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
