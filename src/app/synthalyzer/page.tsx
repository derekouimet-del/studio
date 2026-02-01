import { Header } from '@/components/layout/header';
import { SynthalyzerClient } from '@/components/synthalyzer/synthalyzer-client';

export default function SynthalyzerPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Synthalyzer" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <SynthalyzerClient />
      </main>
    </div>
  );
}
