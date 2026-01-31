import { Header } from '@/components/layout/header';
import { HttpHunterClient } from '@/components/httphunter/http-hunter-client';

export default function HttpHunterPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="HTTP Hunter" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <HttpHunterClient />
      </main>
    </div>
  );
}
