import { Header } from '@/components/layout/header';
import { OracleClient } from '@/components/oracle/oracle-client';

export default function OraclePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header title="Oracle" />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <OracleClient />
      </main>
    </div>
  );
}
