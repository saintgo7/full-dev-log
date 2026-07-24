'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ReportDetail, ReportExport } from '@/components/reports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Calendar,
  FolderKanban,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReport, useDeleteReport } from '@/hooks/useReports';
import type { ReportType } from '@/types';

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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `${startStr} - ${endStr}`;
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-1/3 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-24 bg-muted animate-pulse rounded mb-4" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-3 w-full bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Error State
function ErrorState({ error }: { error: string }) {
  return (
    <Card className="p-12 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">Failed to Load Report</h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      <Link href="/reports">
        <Button variant="outline">Back to Reports</Button>
      </Link>
    </Card>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReportDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: report, isLoading, error } = useReport(id);
  const deleteMutation = useDeleteReport();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      router.push('/reports');
    } catch {
      // Error handling is done by the mutation
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Report Detail" />

      <div className="flex-1 overflow-hidden">
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Back Navigation */}
          <section className="flex items-center justify-between">
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Reports
              </Button>
            </Link>

            {report && (
              <div className="flex items-center gap-2">
                <ReportExport reportId={id} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </Button>
              </div>
            )}
          </section>

          {/* Content */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState error={error instanceof Error ? error.message : 'An error occurred'} />
          ) : report ? (
            <>
              {/* Report Header */}
              <section className="space-y-3">
                <h1 className="text-2xl font-bold">{report.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={cn(
                      'text-sm font-medium capitalize',
                      REPORT_TYPE_COLORS[report.type].bg,
                      REPORT_TYPE_COLORS[report.type].text,
                      'border-transparent'
                    )}
                  >
                    {report.type}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateRange(report.startDate, report.endDate)}</span>
                  </div>
                  {report.project && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderKanban className="w-4 h-4" />
                      <span>{report.project.name}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Report Detail Content */}
              <ReportDetail report={report} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
