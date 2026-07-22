'use client';
import {
  DateTimePicker,
  TimePicker
}               from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useEffect,
  useState
}               from 'react';

type Props = {
  start: Date | undefined;
  end: Date | undefined;
  onChange: (start: Date, end: Date, closePopover?: boolean) => void;
  disabled?: boolean;
  defaultMultiDay?: boolean;
  detectMultiDay?: boolean;
};

const DURATION_PRESETS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr',   minutes: 60 },
  { label: '2 hr',   minutes: 120 },
  { label: 'All day', minutes: null },
] as const;

export const applyDurationPreset = (start: Date, minutes: number): Date =>
  new Date(start.getTime() + minutes * 60_000);

export const applyAllDay = (start: Date): { start: Date; end: Date } => {
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(start); e.setHours(23, 59, 0, 0);
  return { start: s, end: e };
};

export const getActiveMinutes = (start: Date, end: Date): number | null => {
  const allDay =
    start.getHours() === 0 && start.getMinutes() === 0 &&
    end.getHours() === 23 && end.getMinutes() === 59;
  return allDay ? null : (end.getTime() - start.getTime()) / 60_000;
};

const setDatePart = (target: Date, source: Date): Date => {
  const result = new Date(target);
  result.setFullYear(source.getFullYear(), source.getMonth(), source.getDate());
  return result;
};

export const EventDateRangePicker = ({ start, end, onChange, disabled, defaultMultiDay, detectMultiDay }: Props) => {
  const [isMultiDay, setIsMultiDay] = useState(defaultMultiDay ?? false);

  useEffect(() => {
    if (!detectMultiDay) return;
    setIsMultiDay(!!start && !!end && start.toDateString() !== end.toDateString());
  }, [start, end, detectMultiDay]);

  // FullCalendar passes end = next-day 00:00 for single-day clicks (exclusive end).
  // Correct that whenever single-day mode is active and start/end dates diverge.
  // Pass false so the parent doesn't close the popover on this automatic correction.
  useEffect(() => {
    if (isMultiDay || !start || !end) return;
    if (start.toDateString() !== end.toDateString()) {
      onChange(start, setDatePart(end, start), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiDay, start]);

  if (!start || !end) return null;

  const activeMinutes = getActiveMinutes(start, end);
  const isAllDay = activeMinutes === null;

  const handlePreset = (minutes: number | null) => {
    if (minutes === null) {
      const { start: s, end: e } = applyAllDay(start);
      onChange(s, e, false);
    } else {
      onChange(start, applyDurationPreset(start, minutes), false);
    }
  };

  const handleToggleMultiDay = (checked: boolean) => {
    setIsMultiDay(checked);
    if (!checked) {
      onChange(start, setDatePart(end, start));
    }
  };

  const handleSharedDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    onChange(newDate, setDatePart(end, newDate));
  };

  const handleStartDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    onChange(newDate, end);
  };

  const handleEndDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    onChange(start, newDate);
  };

  const handleStartTimeChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    onChange(newDate, isMultiDay ? end : setDatePart(end, newDate), false);
  };

  const handleEndTimeChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    onChange(start, isMultiDay ? newDate : setDatePart(newDate, start), false);
  };

  return (
    <div className='space-y-2 min-w-[312px]'>
      {!isMultiDay ? (
        <>
          <div className='flex flex-col gap-1.5'>
            <Label>Date</Label>
            <DateTimePicker
              value={start}
              onChange={handleSharedDateChange}
              granularity='day'
              displayFormat={{ hour24: 'PP', hour12: 'PP' }}
              disabled={disabled}
            />
          </div>
          {!isAllDay && (
            <div className='grid grid-cols-2 gap-2'>
              <div className='flex flex-col gap-1.5'>
                <Label>Start time</Label>
                <div className='flex h-9 items-center rounded-md border border-input px-3 [&_input]:border-0 [&_input]:shadow-none [&_button]:border-0 [&_button]:shadow-none'>
                  <TimePicker
                    date={start}
                    onChange={handleStartTimeChange}
                    hourCycle={12}
                    granularity='minute'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>End time</Label>
                <div className='flex h-9 items-center rounded-md border border-input px-3 [&_input]:border-0 [&_input]:shadow-none [&_button]:border-0 [&_button]:shadow-none'>
                  <TimePicker
                    date={end}
                    onChange={handleEndTimeChange}
                    hourCycle={12}
                    granularity='minute'
                  />
                </div>
              </div>
            </div>
          )}
          <div className='flex gap-1.5'>
            {DURATION_PRESETS.map(({ label, minutes }) => (
              <Button
                key={label}
                type='button'
                size='sm'
                variant={minutes === activeMinutes ? 'default' : 'outline'}
                className='h-7 flex-1 px-0 text-xs'
                disabled={disabled}
                onClick={() => handlePreset(minutes)}
              >
                {label}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Label className='w-10 shrink-0 text-xs text-muted-foreground'>Start</Label>
            <div className='flex-1'>
              <DateTimePicker
                value={start}
                onChange={handleStartDateChange}
                granularity='day'
                displayFormat={{ hour24: 'PP', hour12: 'PP' }}
                disabled={disabled}
              />
            </div>
            <div className='flex h-9 shrink-0 items-center rounded-md border border-input px-3 [&_input]:border-0 [&_input]:shadow-none [&_button]:border-0 [&_button]:shadow-none'>
              <TimePicker
                date={start}
                onChange={handleStartTimeChange}
                hourCycle={12}
                granularity='minute'
              />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Label className='w-10 shrink-0 text-xs text-muted-foreground'>End</Label>
            <div className='flex-1'>
              <DateTimePicker
                value={end}
                onChange={handleEndDateChange}
                granularity='day'
                displayFormat={{ hour24: 'PP', hour12: 'PP' }}
                disabled={disabled}
              />
            </div>
            <div className='flex h-9 shrink-0 items-center rounded-md border border-input px-3 [&_input]:border-0 [&_input]:shadow-none [&_button]:border-0 [&_button]:shadow-none'>
              <TimePicker
                date={end}
                onChange={handleEndTimeChange}
                hourCycle={12}
                granularity='minute'
              />
            </div>
          </div>
        </div>
      )}
      <div className='flex items-center gap-2 pt-1'>
        <Switch
          id='multi-day'
          checked={isMultiDay}
          onCheckedChange={handleToggleMultiDay}
          disabled={disabled}
        />
        <Label htmlFor='multi-day' className='cursor-pointer font-normal text-sm'>
          Spans multiple days
        </Label>
      </div>
    </div>
  );
};
