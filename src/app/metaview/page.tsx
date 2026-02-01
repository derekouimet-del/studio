import { Header } from '@/components/layout/header';
import { MetaViewClient } from '@/components/metaview/metaview-client';

export default function MetaViewPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="MetaView" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <MetaViewClient />
      </main>
    </div>
  );
}
