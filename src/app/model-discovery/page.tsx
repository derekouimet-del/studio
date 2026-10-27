import { Header } from '@/components/layout/header';
import { ModelDiscoveryClient } from '@/components/model-discovery/model-discovery-client';

export default function ModelDiscoveryPage() {
  return <div className="flex min-h-screen w-full flex-col"><Header title="Model Discovery" /><main className="flex-1 p-4 md:p-6 lg:p-8"><ModelDiscoveryClient /></main></div>;
}
