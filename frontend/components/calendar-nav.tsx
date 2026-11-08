'use client';
import { Button }          from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
}                          from '@/components/ui/command';
import { Input }           from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
}                          from '@/components/ui/popover';
import { useEvents }       from '@/context/events-context';
import { cn }              from '@/lib/utils';
import {
  generateDaysInMonth,
  goNext,
  goPrev,
  handleDayChange,
  handleMonthChange,
  handleYearChange
}                          from '@/utils/calendar-utils';
import { months }          from '@/utils/data';
import { calendarRef }     from '@/utils/data';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  PlusIcon
}                          from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState }        from 'react';

type CalendarNavProps = {
  calendarRef: calendarRef;
  start: Date;
  end: Date;
  viewedDate: Date;
  readOnly?: boolean;
}

const CalendarNav = ({
  calendarRef,
  viewedDate,
  readOnly = false,
}: Omit<CalendarNavProps, 'start' | 'end'>) => {
  const { setEventAddOpen } = useEvents();
  const t = useTranslations('eventDialog');
  const [currentView] = useState('dayGridMonth');

  const selectedMonth = viewedDate.getMonth() + 1;
  const selectedDay = viewedDate.getDate();
  const selectedYear = viewedDate.getFullYear();

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dayOptions = generateDaysInMonth(daysInMonth);

  const [daySelectOpen, setDaySelectOpen] = useState(false);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);

  return (
    <div className='flex min-w-full flex-wrap items-center justify-center gap-3 md:grid md:grid-cols-[1fr_auto_1fr]'>
      {/* Empty left column keeps the date navigation centred */}
      <div className='hidden md:block' />

      <div className='flex flex-row space-x-1'>
        {/* Navigate to previous date interval */}

        <Button
          variant='ghost'
          className='w-8'
          onClick={() => {
            goPrev(calendarRef);
          }}
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        {/* Day Lookup */}

        {currentView == 'timeGridDay' && (
          <Popover open={daySelectOpen} onOpenChange={setDaySelectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                className='w-20 justify-between text-xs font-semibold'
              >
                {selectedDay
                  ? dayOptions.find((day) => day.value === String(selectedDay))
                    ?.label
                  : 'Select day...'}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[200px] p-0'>
              <Command>
                <CommandInput placeholder='Search day...' />
                <CommandList>
                  <CommandEmpty>No day found.</CommandEmpty>
                  <CommandGroup>
                    {dayOptions.map((day) => (
                      <CommandItem
                        key={day.value}
                        value={day.value}
                        onSelect={(currentValue) => {
                          handleDayChange(
                            calendarRef,
                            viewedDate,
                            currentValue
                          );
                          setDaySelectOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            String(selectedDay) === day.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {day.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Month Lookup */}

        <Popover open={monthSelectOpen} onOpenChange={setMonthSelectOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              className='flex w-[120px] justify-between overflow-hidden p-2 text-base font-semibold md:text-lg md:w-[140px]'
            >
              {selectedMonth
                ? months.find((month) => month.value === String(selectedMonth))
                  ?.label
                : 'Select month...'}
              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[200px] p-0'>
            <Command>
              <CommandInput placeholder='Search month...' />
              <CommandList>
                <CommandEmpty>No month found.</CommandEmpty>
                <CommandGroup>
                  {months.map((month) => (
                    <CommandItem
                      key={month.value}
                      value={month.value}
                      onSelect={(currentValue) => {
                        handleMonthChange(
                          calendarRef,
                          viewedDate,
                          currentValue
                        );
                        setMonthSelectOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          String(selectedMonth) === month.value
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {month.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Year Lookup */}

        <Input
          className='w-[85px] md:w-[95px] text-base md:text-lg font-semibold'
          type='number'
          tabIndex={-1}
          value={selectedYear}
          onChange={(value) => handleYearChange(calendarRef, viewedDate, value)}
        />

        {/* Navigate to next date interval */}

        <Button
          variant='ghost'
          className='w-8'
          onClick={() => {
            goNext(calendarRef);
          }}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>

        {/* Small screens: a compact + keeps the toolbar on one row */}
        {!readOnly && (
          <Button
            size='icon'
            className='ml-1 h-10 w-11 shrink-0 md:hidden'
            aria-label={t('add')}
            onClick={() => setEventAddOpen(true)}
          >
            <PlusIcon className='h-5 w-5' />
          </Button>
        )}
      </div>

      <div className='hidden md:block md:justify-self-end'>
        {!readOnly && (
          <Button
            className='w-28 text-sm'
            variant='default'
            onClick={() => setEventAddOpen(true)}
          >
            {t('add')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default CalendarNav;
