import { Header } from '@/components/layout/header';
import { DefaultPassClient } from '@/components/default-pass/default-pass-client';

export default function DefaultPassPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Default Pass" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <DefaultPassClient />
      </main>
    </div>
  );
}
