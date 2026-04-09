import { Header } from '@/components/layout/header';
import { PortForwardClient } from '@/components/port-forward/port-forward-client';

export default function PortForwardPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Port Forward Tester" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PortForwardClient />
      </main>
    </div>
  );
}
