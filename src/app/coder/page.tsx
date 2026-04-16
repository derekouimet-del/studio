import { Header } from '@/components/layout/header';
import { CoderClient } from '@/components/coder/coder-client';

export default function CoderPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Coder" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <CoderClient />
      </main>
    </div>
  );
}
