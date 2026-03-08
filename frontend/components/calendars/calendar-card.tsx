import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { Calendar } from '@/lib/types';
import { format }        from 'date-fns';
import { CalendarIcon }  from 'lucide-react';

interface CalendarCardProps {
  calendar: Calendar;
}

export function CalendarCard({ calendar }: CalendarCardProps) {
  const createdAt = new Date(calendar.created_at);

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start gap-3'>
          <CalendarIcon className='mt-0.5 h-5 w-5 shrink-0 text-muted-foreground' />
          <div className='min-w-0'>
            <CardTitle className='text-lg'>{calendar.name}</CardTitle>
            <CardDescription>
              Created {format(createdAt, 'MMMM d, yyyy')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
