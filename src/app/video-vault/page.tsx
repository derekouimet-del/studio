import { Header } from '@/components/layout/header';
import { VideoVaultClient } from '@/components/video-vault/video-vault-client';

export default function VideoVaultPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Video Vault" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <VideoVaultClient />
      </main>
    </div>
  );
}
