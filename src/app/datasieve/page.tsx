import { Header } from '@/components/layout/header';
import { DataSieveClient } from '@/components/datasieve/datasieve-client';

export default function DataSievePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="DataSieve" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <DataSieveClient />
      </main>
    </div>
  );
}
