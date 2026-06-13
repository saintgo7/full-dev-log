'use client';

import { TrendingUp, TrendingDown, Minus, Flame, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ProductivityMetrics } from '@/types';

interface ProductivityScoreProps {
  metrics: ProductivityMetrics | undefined;
  isLoading?: boolean;
  className?: string;
}

const LEVEL_LABELS = {
  low: 'Needs Improvement',
  medium: 'Average',
  high: 'Good',
  excellent: 'Excellent',
};

// Get color based on score (0-100)
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-yellow-500 to-amber-500';
  if (score >= 40) return 'from-orange-500 to-amber-500';
  return 'from-red-500 to-orange-500';
}

function getBackgroundColor(score: number): string {
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-yellow-500/10';
  if (score >= 40) return 'bg-orange-500/10';
  return 'bg-red-500/10';
}

export function ProductivityScore({ metrics, isLoading, className }: ProductivityScoreProps) {
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Productivity Score</CardTitle>
          <CardDescription>Calculating your productivity...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="relative w-40 h-40 animate-pulse">
              <div className="absolute inset-0 rounded-full bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Productivity Score</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Start tracking your activities to see your productivity score.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { score, previousScore, trend, level, streakDays, focusScore, consistencyScore } = metrics;
  const scoreColor = getScoreColor(score);
  const gradient = getScoreGradient(score);
  const bgColor = getBackgroundColor(score);

  // Calculate the circumference and offset for the circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Productivity Score</CardTitle>
        <CardDescription>{LEVEL_LABELS[level]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress Indicator */}
        <div className="flex justify-center">
          <div className="relative w-44 h-44">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle with gradient */}
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={cn('stop-color-current', score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : score >= 40 ? 'text-orange-500' : 'text-red-500')} style={{ stopColor: score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444' }} />
                  <stop offset="100%" className={cn('stop-color-current', score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : score >= 40 ? 'text-amber-500' : 'text-orange-500')} style={{ stopColor: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f59e0b' : '#f97316' }} />
                </linearGradient>
              </defs>
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke="url(#scoreGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Score text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-4xl font-bold', scoreColor)}>{score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
        </div>

        {/* Comparison with previous period */}
        <div className={cn('flex items-center justify-center gap-2 p-2 rounded-lg', bgColor)}>
          {trend > 0 ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                +{trend}% from last period
              </span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {trend}% from last period
              </span>
            </>
          ) : (
            <>
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">No change from last period</span>
            </>
          )}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            <Flame className="h-5 w-5 text-orange-500 mb-1" />
            <span className="text-lg font-semibold">{streakDays}</span>
            <span className="text-xs text-muted-foreground">Day Streak</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            <Target className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-lg font-semibold">{focusScore}</span>
            <span className="text-xs text-muted-foreground">Focus</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            <Zap className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-lg font-semibold">{consistencyScore}</span>
            <span className="text-xs text-muted-foreground">Consistency</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
