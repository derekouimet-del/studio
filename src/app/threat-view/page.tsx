import { Header } from '@/components/layout/header';
import { ThreatViewClient } from '@/components/threat-view/threat-view-client';

export default function ThreatViewPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="ThreatView" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ThreatViewClient />
      </main>
    </div>
  );
}
