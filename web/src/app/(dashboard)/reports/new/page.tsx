'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ReportGenerator } from '@/components/reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/services/projects';

export default function NewReportPage() {
  // Fetch projects for the generator
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  return (
    <div className="h-screen flex flex-col">
      <Header title="New Report" />

      <div className="flex-1 overflow-hidden">
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Back Navigation */}
          <section>
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Reports
              </Button>
            </Link>
          </section>

          {/* Generator */}
          <section className="flex justify-center">
            {projectsLoading ? (
              <Card className="w-full max-w-2xl">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading projects...</p>
                </CardContent>
              </Card>
            ) : (
              <ReportGenerator projects={projects || []} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
