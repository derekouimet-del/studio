import { Header } from '@/components/layout/header';
import { VulnDBExplorerClient } from '@/components/vulndb-explorer/vulndb-explorer-client';

export default function VulnDBExplorerPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="VulnDB Explorer" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <VulnDBExplorerClient />
      </main>
    </div>
  );
}
