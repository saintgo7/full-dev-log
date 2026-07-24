'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PatternAnalysis } from '@/types';

interface PatternChartProps {
  patterns: PatternAnalysis | undefined;
  isLoading?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PatternChart({ patterns, isLoading, className }: PatternChartProps) {
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Activity Patterns</CardTitle>
          <CardDescription>Analyzing your work patterns...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!patterns) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Activity Patterns</CardTitle>
          <CardDescription>No pattern data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start tracking your activities to see pattern analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxHourlyCount = Math.max(...patterns.hourlyActivity.map((h) => h.count), 1);
  const maxDayCount = Math.max(...patterns.dayOfWeekActivity.map((d) => d.count), 1);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Activity Patterns</CardTitle>
        <CardDescription>
          Peak hours: {patterns.peakHours.map((h) => `${h}:00`).join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hourly Activity Bar Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Hourly Activity</h4>
          <div className="flex items-end gap-1 h-32">
            {HOURS.map((hour) => {
              const data = patterns.hourlyActivity.find((h) => h.hour === hour);
              const count = data?.count ?? 0;
              const isPeak = data?.isPeakHour ?? false;
              const height = maxHourlyCount > 0 ? (count / maxHourlyCount) * 100 : 0;

              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center group relative"
                >
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all duration-200',
                      isPeak
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/40'
                    )}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${hour}:00 - ${count} activities`}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {hour}:00 - {count} activities
                      {isPeak && <span className="ml-1 text-primary">(peak)</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Hour labels */}
          <div className="flex gap-1 mt-1">
            {[0, 6, 12, 18, 23].map((hour) => (
              <span
                key={hour}
                className="text-xs text-muted-foreground"
                style={{
                  position: 'relative',
                  left: `${(hour / 23) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {hour}:00
              </span>
            ))}
          </div>
        </div>

        {/* Day of Week Heatmap */}
        <div>
          <h4 className="text-sm font-medium mb-3">Weekly Pattern</h4>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, idx) => {
              const data = patterns.dayOfWeekActivity.find((d) => d.day === idx);
              const count = data?.count ?? 0;
              const intensity = data?.intensity ?? 0;
              const percentage = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;

              // Color intensity based on activity level
              const getIntensityClass = () => {
                if (intensity >= 0.8) return 'bg-primary';
                if (intensity >= 0.6) return 'bg-primary/80';
                if (intensity >= 0.4) return 'bg-primary/60';
                if (intensity >= 0.2) return 'bg-primary/40';
                return 'bg-muted';
              };

              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'w-full aspect-square rounded-md flex items-center justify-center transition-colors',
                      getIntensityClass()
                    )}
                    title={`${data?.dayName ?? day}: ${count} activities`}
                  >
                    <span
                      className={cn(
                        'text-xs font-medium',
                        intensity >= 0.4 ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {count}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Most Productive Day</p>
            <p className="text-lg font-semibold">{patterns.mostProductiveDay}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Session</p>
            <p className="text-lg font-semibold">
              {Math.round(patterns.averageSessionDuration)} min
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
