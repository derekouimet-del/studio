import { Header } from '@/components/layout/header';
import { VoiceWeaverClient } from '@/components/voiceweaver/voiceweaver-client';

export default function VoiceWeaverPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Voice Weaver" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <VoiceWeaverClient />
      </main>
    </div>
  );
}
