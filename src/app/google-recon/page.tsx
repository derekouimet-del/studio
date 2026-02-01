import { Header } from '@/components/layout/header';
import { GoogleReconClient } from '@/components/google-recon/google-recon-client';

export default function GoogleReconPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Google Recon" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <GoogleReconClient />
      </main>
    </div>
  );
}
