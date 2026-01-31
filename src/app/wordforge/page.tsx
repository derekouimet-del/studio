import { Header } from '@/components/layout/header';
import { WordForgeClient } from '@/components/wordforge/wordforge-client';

export default function WordForgePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="WordForge" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <WordForgeClient />
      </main>
    </div>
  );
}
