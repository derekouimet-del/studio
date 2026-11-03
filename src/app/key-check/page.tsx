import { Header } from '@/components/layout/header';
import { KeyCheckClient } from '@/components/key-check/key-check-client';

export default function KeyCheckPage() {
  return <div className="flex min-h-screen w-full flex-col"><Header title="API Key Check" /><main className="flex-1 p-4 md:p-6 lg:p-8"><KeyCheckClient /></main></div>;
}
