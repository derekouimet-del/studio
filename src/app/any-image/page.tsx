import { Header } from '@/components/layout/header';
import { AnyImageClient } from '@/components/any-image/any-image-client';

export default function AnyImagePage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header title="Any_Image" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <AnyImageClient />
      </main>
    </div>
  );
}
