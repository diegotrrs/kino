import { cn } from '@/lib/utils';

export const Stamp = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span
      className={cn(
        'inline-block rotate-3 rounded-sm border-2 border-primary px-1.5 py-1 text-center font-mono text-[0.6rem] font-medium uppercase leading-tight tracking-widest text-primary',
        className,
      )}
    >
      {children}
    </span>
  );
};
