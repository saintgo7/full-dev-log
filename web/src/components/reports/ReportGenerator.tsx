'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  CalendarDays,
  CalendarRange,
  FolderKanban,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGenerateReport } from '@/hooks/useReports';
import type { ReportType, Project } from '@/types';

interface ReportGeneratorProps {
  projects?: Project[];
  className?: string;
}

// Report type options
const reportTypes: Array<{
  value: ReportType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'daily',
    label: 'Daily Report',
    description: "Yesterday's development activity",
    icon: Clock,
  },
  {
    value: 'weekly',
    label: 'Weekly Report',
    description: 'Last 7 days summary',
    icon: CalendarDays,
  },
  {
    value: 'monthly',
    label: 'Monthly Report',
    description: 'Last 30 days overview',
    icon: Calendar,
  },
  {
    value: 'custom',
    label: 'Custom Range',
    description: 'Select specific date range',
    icon: CalendarRange,
  },
];

export function ReportGenerator({ projects = [], className }: ReportGeneratorProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ReportType>('weekly');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useGenerateReport();

  const handleGenerate = async () => {
    setError(null);

    // Validation for custom type
    if (selectedType === 'custom') {
      if (!startDate || !endDate) {
        setError('Please select both start and end dates for custom range.');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setError('Start date must be before end date.');
        return;
      }
    }

    try {
      const result = await generateMutation.mutateAsync({
        type: selectedType,
        projectId: selectedProjectId || undefined,
        startDate: selectedType === 'custom' ? startDate : undefined,
        endDate: selectedType === 'custom' ? endDate : undefined,
      });

      // Navigate to the new report
      router.push(`/reports/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    }
  };

  return (
    <Card className={cn('max-w-2xl', className)}>
      <CardHeader>
        <CardTitle>Generate New Report</CardTitle>
        <CardDescription>
          Select the report type and optionally filter by project
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Report Type</label>
          <div className="grid grid-cols-2 gap-3">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-md',
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedType === 'custom' && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/30">
            <label className="text-sm font-medium">Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        )}

        {/* Project Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Project{' '}
            <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedProjectId === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedProjectId('')}
              className="gap-2"
            >
              <FolderKanban className="w-4 h-4" />
              All Projects
            </Button>
            {projects.map((project) => (
              <Button
                key={project.id}
                type="button"
                variant={selectedProjectId === project.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProjectId(project.id)}
              >
                {project.name}
              </Button>
            ))}
          </div>
          {projects.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No projects available. Report will include all activities.
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <div className="text-sm font-medium">Report Summary</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {reportTypes.find((t) => t.value === selectedType)?.label}
            </Badge>
            {selectedProjectId ? (
              <Badge variant="outline">
                {projects.find((p) => p.id === selectedProjectId)?.name}
              </Badge>
            ) : (
              <Badge variant="outline">All Projects</Badge>
            )}
            {selectedType === 'custom' && startDate && endDate && (
              <Badge variant="outline">
                {startDate} ~ {endDate}
              </Badge>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/reports')}
          disabled={generateMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
