'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ReportList } from '@/components/reports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import type { ReportType } from '@/types';

// Filter options
const typeFilters: Array<{ value: ReportType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType | 'all'>('all');

  // Fetch reports with type filter
  const {
    data: reportsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useReports({
    type: selectedType === 'all' ? undefined : selectedType,
    limit: 12,
  });

  // Flatten paginated reports
  const reports = reportsData?.pages.flatMap((page) => page.items) ?? [];

  // Handle load more
  const handleLoadMore = () => {
    fetchNextPage();
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Reports" />

      <div className="flex-1 overflow-hidden">
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Header Actions */}
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
              <div className="flex gap-2">
                {typeFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedType === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <Link href="/reports/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Report
              </Button>
            </Link>
          </section>

          {/* Reports Count */}
          <section className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Reports</h2>
            <Badge variant="outline" className="text-xs">
              {reports.length} reports
            </Badge>
          </section>

          {/* Reports Grid */}
          <section>
            <ReportList
              reports={reports}
              isLoading={isLoading}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={handleLoadMore}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
