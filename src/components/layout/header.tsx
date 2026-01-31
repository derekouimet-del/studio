import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background/95 px-4 sticky top-0 z-30 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-lg font-semibold md:text-2xl font-headline">{title}</h1>
    </header>
  );
}
