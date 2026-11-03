import type { CalendarMember } from '@/lib/types';
import { cn }                  from '@/lib/utils';
import { getTranslations }     from 'next-intl/server';

const AVATAR_COLORS = ['bg-ev-terracotta', 'bg-ev-teal', 'bg-ev-ochre', 'bg-ev-sage', 'bg-ev-plum', 'bg-ev-slate'] as const;

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const TravellersPanel = async ({ members }: { members: Pick<CalendarMember, 'id' | 'name'>[] }) => {
  const t = await getTranslations('tripPass');

  return (
    <div className='grid gap-3 rounded-md border bg-card p-4' data-testid='travellers-panel'>
      <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
        {t('travellers', { count: members.length })}
      </span>
      <div className='flex flex-wrap gap-2'>
        {members.map((member, index) => (
          <span
            key={member.id}
            title={member.name}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-background',
              AVATAR_COLORS[index % AVATAR_COLORS.length],
            )}
          >
            {getInitials(member.name)}
          </span>
        ))}
      </div>
    </div>
  );
};
