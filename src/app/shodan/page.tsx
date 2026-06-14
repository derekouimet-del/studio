import { Header } from '@/components/layout/header';
import { ShodanForgeClient } from '@/components/shodan/shodan-client';

export default function ShodanForgePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="ShodanForge" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <ShodanForgeClient />
      </main>
    </div>
  );
}
