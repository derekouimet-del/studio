import { Header } from '@/components/layout/header';
import { BreachInspectorClient } from '@/components/breach-inspector/breach-inspector-client';

export default function BreachInspectorPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Breach Inspector" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <BreachInspectorClient />
      </main>
    </div>
  );
}
