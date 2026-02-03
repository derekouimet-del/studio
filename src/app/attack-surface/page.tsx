import { Header } from '@/components/layout/header';
import { AttackSurfaceClient } from '@/components/attack-surface/attack-surface-client';

export default function AttackSurfacePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Attack Surface Mapper" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <AttackSurfaceClient />
      </main>
    </div>
  );
}
