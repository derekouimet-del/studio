import { Header } from '@/components/layout/header';
import { ScanWeaverClient } from '@/components/scanweaver/scanweaver-client';

export default function ScanWeaverPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="ScanWeaver" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ScanWeaverClient />
      </main>
    </div>
  );
}
