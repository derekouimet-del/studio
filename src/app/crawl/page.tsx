import { Header } from '@/components/layout/header';
import { WebCrawlerClient } from '@/components/crawl/web-crawler-client';

export default function WebCrawlerPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Web Crawler" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <WebCrawlerClient />
      </main>
    </div>
  );
}
