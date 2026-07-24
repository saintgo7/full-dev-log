'use client';

import { Button } from '@/components/ui/button';
import {
  FileCode,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExportReport } from '@/hooks/useReports';
import type { ReportExportFormat } from '@/services/report';

interface ReportExportProps {
  reportId: string;
  className?: string;
}

export function ReportExport({ reportId, className }: ReportExportProps) {
  const exportMutation = useExportReport();

  const handleExport = (format: ReportExportFormat) => {
    exportMutation.mutate({ id: reportId, format });
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground mr-2">
        <Download className="w-4 h-4 inline-block mr-1" />
        Export:
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('markdown')}
        disabled={exportMutation.isPending}
        className="gap-2"
      >
        {exportMutation.isPending && exportMutation.variables?.format === 'markdown' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileCode className="w-4 h-4" />
        )}
        Markdown
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('html')}
        disabled={exportMutation.isPending}
        className="gap-2"
      >
        {exportMutation.isPending && exportMutation.variables?.format === 'html' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        HTML
      </Button>
    </div>
  );
}
