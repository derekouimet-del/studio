import { Header } from '@/components/layout/header';
import { ReconGraphClient } from '@/components/recon-graph/recon-graph-client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recon Graph - PenQuest',
  description: 'Visualize target infrastructure, relationships, exposures, and findings in one interactive graph.',
};

export default function ReconGraphPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Recon Graph" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ReconGraphClient />
      </main>
    </div>
  );
}
