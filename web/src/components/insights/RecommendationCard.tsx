'use client';

import { Clock, Coffee, Lightbulb, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Recommendation, RecommendationCategory } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

const CATEGORY_ICONS: Record<RecommendationCategory, React.ReactNode> = {
  optimal_hours: <Clock className="h-4 w-4" />,
  break_suggestion: <Coffee className="h-4 w-4" />,
  productivity_tip: <Lightbulb className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<RecommendationCategory, string> = {
  optimal_hours: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  break_suggestion: 'bg-green-500/10 text-green-600 dark:text-green-400',
  productivity_tip: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  optimal_hours: 'Optimal Hours',
  break_suggestion: 'Break Suggestion',
  productivity_tip: 'Productivity Tip',
};

export function RecommendationCard({ recommendation, className }: RecommendationCardProps) {
  const icon = CATEGORY_ICONS[recommendation.category];
  const colorClass = CATEGORY_COLORS[recommendation.category];
  const label = CATEGORY_LABELS[recommendation.category];

  const handleAction = () => {
    if (recommendation.actionUrl) {
      window.open(recommendation.actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-full', colorClass)}>{icon}</div>
            <div>
              <h4 className="text-sm font-semibold">{recommendation.title}</h4>
              <Badge variant="outline" className="text-xs mt-1">
                {label}
              </Badge>
            </div>
          </div>
          {recommendation.priority > 0 && (
            <Badge variant="secondary" className="text-xs">
              Priority {recommendation.priority}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
        {recommendation.actionLabel && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAction}
          >
            {recommendation.actionLabel}
            {recommendation.actionUrl && <ExternalLink className="h-3 w-3 ml-2" />}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  emptyMessage?: string;
  className?: string;
}

export function RecommendationList({
  recommendations,
  emptyMessage = 'No recommendations available',
  className,
}: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Sort by priority (higher first)
  const sortedRecommendations = [...recommendations].sort(
    (a, b) => b.priority - a.priority
  );

  return (
    <div className={cn('space-y-3', className)}>
      {sortedRecommendations.map((recommendation) => (
        <RecommendationCard key={recommendation.id} recommendation={recommendation} />
      ))}
    </div>
  );
}
