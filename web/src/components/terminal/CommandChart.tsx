'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HourlyData {
  hour: number;
  count: number;
}

interface CommandChartProps {
  data?: HourlyData[];
  isLoading?: boolean;
  className?: string;
}

export function CommandChart({ data, isLoading, className }: CommandChartProps) {
  // Fill in missing hours and sort
  const chartData = useMemo(() => {
    const hourMap = new Map<number, number>();

    // Initialize all 24 hours with 0
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, 0);
    }

    // Fill with actual data
    if (data) {
      data.forEach((d) => {
        hourMap.set(d.hour, d.count);
      });
    }

    // Convert to sorted array
    return Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);
  }, [data]);

  const maxCount = useMemo(() => {
    return Math.max(...chartData.map((d) => d.count), 1);
  }, [chartData]);

  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12AM';
    if (hour === 12) return '12PM';
    return hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Hourly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-1">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-muted animate-pulse rounded-t"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Hourly Activity</CardTitle>
        <p className="text-xs text-muted-foreground">
          Command execution by hour of day
        </p>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-48 flex items-end gap-0.5 px-1">
          {chartData.map(({ hour, count }) => {
            const heightPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isWorkHours = hour >= 9 && hour < 18;
            const isPeakHour = count === maxCount && count > 0;

            return (
              <div
                key={hour}
                className="flex-1 group relative"
                title={`${formatHour(hour)}: ${count} commands`}
              >
                <div
                  className={cn(
                    'w-full rounded-t transition-all duration-200',
                    'hover:opacity-80 cursor-pointer',
                    isPeakHour
                      ? 'bg-green-500'
                      : isWorkHours
                      ? 'bg-green-500/60'
                      : 'bg-green-500/30'
                  )}
                  style={{
                    height: `${Math.max(heightPercentage, count > 0 ? 4 : 1)}%`,
                    minHeight: count > 0 ? '4px' : '1px',
                  }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border">
                  <div className="font-medium">{formatHour(hour)}</div>
                  <div className="text-muted-foreground">
                    {count} command{count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[10px] text-muted-foreground">12AM</span>
          <span className="text-[10px] text-muted-foreground">6AM</span>
          <span className="text-[10px] text-muted-foreground">12PM</span>
          <span className="text-[10px] text-muted-foreground">6PM</span>
          <span className="text-[10px] text-muted-foreground">11PM</span>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/30" />
            <span>Off-hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/60" />
            <span>Work hours (9-18)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Peak hour</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
