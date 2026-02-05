import { Header } from '@/components/layout/header';
import { ArsenalClient } from '@/components/arsenal/arsenal-client';

export default function ArsenalPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="The Arsenal" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ArsenalClient />
      </main>
    </div>
  );
}
