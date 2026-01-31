import { Header } from '@/components/layout/header';
import { scanResults, type ScanResult } from '@/lib/data';
import { notFound } from 'next/navigation';
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
  const hostData = scanResults.find((r) => r.host === params.host);

  if (!hostData) {
    notFound();
  }

  const getStatusBadgeVariant = (status: ScanResult['status']) => {
    switch (status) {
      case 'Open':
        return 'destructive';
      case 'Filtered':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title={`Assessment for ${params.host}`} />
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
              <span className="font-code">{hostData.host}:{hostData.port}</span>
            </div>
             <div className="flex items-center gap-2">
              <ShieldQuestion className="size-4 text-muted-foreground" />
              <strong>Service:</strong>
              <span>{hostData.service}</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="size-4 text-muted-foreground" />
              <strong>Version:</strong>
              <span className="font-code">{hostData.version}</span>
            </div>
            <div className="flex items-center gap-2">
              <strong>Status:</strong>
              <Badge variant={getStatusBadgeVariant(hostData.status)}>
                {hostData.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <VulnerabilityAssessmentClient serviceData={hostData} />
      </main>
    </div>
  );
}
