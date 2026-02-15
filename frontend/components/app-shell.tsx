import { DesktopSidebar }    from '@/components/desktop-sidebar';
import { MobileBottomNav }   from '@/components/mobile-bottom-nav';
import { TopBar }            from '@/components/top-bar';
import { TooltipProvider }   from '@/components/ui/tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <TopBar />
      <DesktopSidebar />
      <MobileBottomNav />
      <main className='md:ml-16 pb-16 md:pb-0'>{children}</main>
    </TooltipProvider>
  );
}
