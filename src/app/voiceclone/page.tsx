import { Header } from '@/components/layout/header';
import { VoiceCloneClient } from '@/components/voiceclone/voiceclone-client';

export default function VoiceClonePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Voice Clone" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <VoiceCloneClient />
      </main>
    </div>
  );
}
