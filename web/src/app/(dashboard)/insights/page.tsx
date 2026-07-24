'use client';

import { useState } from 'react';
import { Brain, RefreshCw, Calendar } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PatternChart } from '@/components/insights/PatternChart';
import { AnomalyList } from '@/components/insights/AnomalyCard';
import { RecommendationList } from '@/components/insights/RecommendationCard';
import { ProductivityScore } from '@/components/insights/ProductivityScore';
import { useInsights, useDismissAnomaly } from '@/hooks/useInsights';

type TimeRange = '7d' | '30d' | '90d';

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // Calculate date range based on selection
  const getDateRange = (range: TimeRange) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange(timeRange);

  const {
    data: insights,
    isLoading,
    refetch
  } = useInsights(dateRange);

  const dismissMutation = useDismissAnomaly();

  const handleDismissAnomaly = (id: string) => {
    dismissMutation.mutate(id);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Filter out dismissed anomalies
  const activeAnomalies = insights?.anomalies.filter((a) => !a.dismissed) ?? [];

  return (
    <div>
      <Header title="AI Insights" />

      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Activity Insights</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis of your development patterns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={timeRange === '7d' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === '90d' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('90d')}
              >
                90 Days
              </Button>
            </div>

            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Pattern Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <PatternChart
              patterns={insights?.patterns}
              isLoading={isLoading}
            />

            {/* Anomalies Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Detected Anomalies
                  {activeAnomalies.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full">
                      {activeAnomalies.length}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Unusual patterns detected in your activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnomalyList
                  anomalies={activeAnomalies}
                  onDismiss={handleDismissAnomaly}
                  isLoading={dismissMutation.isPending}
                  emptyMessage="No anomalies detected. Your activity patterns look normal!"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Productivity & Recommendations */}
          <div className="space-y-6">
            <ProductivityScore
              metrics={insights?.productivity}
              isLoading={isLoading}
            />

            {/* Recommendations Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Personalized tips to improve your productivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <RecommendationList
                    recommendations={insights?.recommendations ?? []}
                    emptyMessage="No recommendations yet. Keep tracking your activities!"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
          <Calendar className="h-3 w-3" />
          <span>
            Data from {dateRange.startDate} to {dateRange.endDate}
          </span>
        </div>
      </div>
    </div>
  );
}
