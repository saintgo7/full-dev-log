'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report, ReportType } from '@/types';

interface ReportListProps {
  reports: Report[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

// Report type badge colors
const REPORT_TYPE_COLORS: Record<ReportType, { bg: string; text: string }> = {
  daily: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
  },
  weekly: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
  },
  monthly: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
  },
  custom: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
  },
};

// Format date range
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startStr = start.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startStr} - ${endStr}`;
}

// Format relative time
function formatRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function ReportCard({ report }: { report: Report }) {
  const typeColors = REPORT_TYPE_COLORS[report.type];

  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Badge
              className={cn(
                'text-xs font-medium capitalize',
                typeColors.bg,
                typeColors.text,
                'border-transparent'
              )}
            >
              {report.type}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardTitle className="text-base font-semibold line-clamp-2 mt-2">
            {report.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDateRange(report.startDate, report.endDate)}</span>
          </div>

          {/* Project */}
          {report.project && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban className="w-4 h-4" />
              <span className="truncate">{report.project.name}</span>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {report.summary.totalEvents.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {Math.round(report.summary.totalActiveMinutes / 60)}h
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {report.summary.productivityScore}
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Created Time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Clock className="w-3 h-3" />
            <span>Created {formatRelativeTime(report.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
        <div className="h-5 w-3/4 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-6 w-12 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-3 w-10 bg-muted animate-pulse rounded mx-auto mt-1" />
            </div>
          ))}
        </div>
        <div className="h-3 w-24 bg-muted animate-pulse rounded mt-2" />
      </CardContent>
    </Card>
  );
}

export function ReportList({
  reports,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  className,
}: ReportListProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {[...Array(6)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate your first report to see your development activity summary.
        </p>
        <Link href="/reports/new">
          <Button>Generate Report</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
