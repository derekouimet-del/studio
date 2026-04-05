import { Header } from '@/components/layout/header';
import { KaliForgeClient } from '@/components/kali-forge/kali-forge-client';

export default function KaliForgePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Kali Forge" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <KaliForgeClient />
      </main>
    </div>
  );
}
