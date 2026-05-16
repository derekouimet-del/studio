import { Header } from '@/components/layout/header';
import { VirusScannerClient } from '@/components/virus-scanner/virus-scanner-client';

export default function VirusScannerPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Virus Scanner" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <VirusScannerClient />
      </main>
    </div>
  );
}
