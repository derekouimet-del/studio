import { Header } from '@/components/layout/header';
import { FofaForgeClient } from '@/components/fofa/fofa-client';

export default function FofaForgePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="FofaForge" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <FofaForgeClient />
      </main>
    </div>
  );
}
