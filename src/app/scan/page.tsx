import { Header } from '@/components/layout/header';
import { NetworkScanClient } from '@/components/scan/network-scan-client';

export default function NetworkScanPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Network Scan" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <NetworkScanClient />
      </main>
    </div>
  );
}
