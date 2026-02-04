'use client'; // This page now needs to be a client component to use searchParams

import { useSearchParams, notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { VulnerabilityAssessmentClient } from '@/components/scan/vulnerability-assessment-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, ShieldQuestion, Network, Code } from 'lucide-react';

export default function AssessmentPage({ params }: { params: { host: string } }) {
  const searchParams = useSearchParams();

  const port = searchParams.get('port');
  const service = searchParams.get('service');
  const version = searchParams.get('version');

  // We need all params to proceed
  if (!port || !service) {
    notFound();
  }

  const targetData = {
    host: params.host,
    port: parseInt(port),
    service: service,
    version: version || '',
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title={`Assessment for ${params.host}:${port}`} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server /> Target Details
            </CardTitle>
            <CardDescription>
              Information about the selected service for vulnerability
              assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Network className="size-4 text-muted-foreground" />
              <strong>Host:</strong>
              <span className="font-code">{targetData.host}:{targetData.port}</span>
            </div>
             <div className="flex items-center gap-2">
              <ShieldQuestion className="size-4 text-muted-foreground" />
              <strong>Service:</strong>
              <span>{targetData.service}</span>
            </div>
            {targetData.version && (
                <div className="flex items-center gap-2 col-span-2">
                <Code className="size-4 text-muted-foreground" />
                <strong>Version:</strong>
                <span className="font-code">{targetData.version}</span>
                </div>
            )}
          </CardContent>
        </Card>

        <VulnerabilityAssessmentClient targetData={targetData} />
      </main>
    </div>
  );
}
