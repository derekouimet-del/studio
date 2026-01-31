import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reports } from '@/lib/data';
import { FileText, Calendar } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Reports" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Generated Reports</h2>
                <p className="text-muted-foreground">Review past findings and recommendations.</p>
            </div>
          <Button>Generate New Report</Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <FileText className="size-8 text-primary mb-4" />
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {report.date}
                    </div>
                </div>
                <CardTitle>{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {report.summary}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Report
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
