import CalendarNoSSR    from '@/components/calendar-no-ssr';
import { Button }       from '@/components/ui/button';
import { EventsProvider } from '@/context/events-context';
import {
  CalendarDays,
  CalendarCheck2,
  Globe2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Link             from 'next/link';

const features = [
  {
    icon: CalendarDays,
    title: 'Multiple Holiday Calendars',
    description:
      'Keep summer getaways, winter breaks, and long weekends in separate calendars so nothing overlaps and everything stays clear.',
  },
  {
    icon: Globe2,
    title: 'Plan Any Destination',
    description:
      'From a weekend city break to a month-long road trip — add events, set times, and colour-code every moment of your itinerary.',
  },
  {
    icon: CalendarCheck2,
    title: 'Month, Week & Day Views',
    description:
      'Switch between views to zoom in on a single day of activities or zoom out to see your entire holiday season at a glance.',
  },
  {
    icon: Sparkles,
    title: 'Drag, Drop & Edit',
    description:
      'Plans change. Drag events to new slots, resize them, and edit every detail without losing the bigger picture.',
  },
];

const steps = [
  { step: '01', title: 'Create a calendar', body: 'Give your trip a name — "Maldives 2026", "Christmas in Vienna", whatever fits.' },
  { step: '02', title: 'Add your events',   body: 'Click any day to add flights, hotel check-ins, tours, dinners, and free time.' },
  { step: '03', title: 'Enjoy your holiday', body: 'Open Kino on your phone and follow the plan. Or ignore it and have fun anyway.' },
];

export default function Home() {
  return (
    <div className='flex flex-col'>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className='relative overflow-hidden px-6 py-20 md:py-32 text-center'>
        {/* soft gradient blob */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 -z-10 flex items-center justify-center'
        >
          <div className='h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl' />
        </div>

        <p className='mb-3 text-sm font-semibold uppercase tracking-widest text-primary'>
          Kino Calendars
        </p>
        <h1 className='mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl'>
          Your holidays,{' '}
          <span className='text-primary'>perfectly planned.</span>
        </h1>
        <p className='mx-auto mt-6 max-w-xl text-lg text-muted-foreground'>
          Create dedicated holiday calendars, map out every day of your trip, and never double-book a beach day again.
        </p>
        <div className='mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
          <Button size='lg' asChild>
            <Link href='/signup'>
              Get started free <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link href='/login'>Sign in</Link>
          </Button>
        </div>
        <ul className='mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground'>
          {['No credit card required', 'Free forever plan', 'Works on any device'].map((item) => (
            <li key={item} className='flex items-center gap-1.5'>
              <CheckCircle2 className='h-4 w-4 text-primary' />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Live Demo ─────────────────────────────────────────────── */}
      <section className='px-6 pb-20'>
        <div className='mx-auto max-w-5xl'>
          <div className='mb-8 text-center'>
            <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Try it right now</h2>
            <p className='mt-2 text-muted-foreground'>
              No sign-up needed. Click any day to add an event, drag to reschedule, click an event to edit or delete.
            </p>
          </div>
          <div className='rounded-xl border bg-card shadow-sm overflow-hidden p-4 md:p-6'>
            <EventsProvider>
              <CalendarNoSSR />
            </EventsProvider>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className='bg-muted/40 px-6 py-20'>
        <div className='mx-auto max-w-5xl'>
          <div className='mb-12 text-center'>
            <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Everything you need to plan a great trip
            </h2>
            <p className='mt-2 text-muted-foreground'>
              Kino is built around the way travellers actually think.
            </p>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className='rounded-xl border bg-card p-6 shadow-sm'
              >
                <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                  <Icon className='h-5 w-5 text-primary' />
                </div>
                <h3 className='mb-2 font-semibold'>{title}</h3>
                <p className='text-sm text-muted-foreground'>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className='px-6 py-20'>
        <div className='mx-auto max-w-3xl'>
          <div className='mb-12 text-center'>
            <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Up and running in minutes
            </h2>
          </div>
          <ol className='relative border-l border-border pl-8 space-y-10'>
            {steps.map(({ step, title, body }) => (
              <li key={step} className='relative'>
                <span className='absolute -left-[2.85rem] flex h-9 w-9 items-center justify-center rounded-full border bg-background text-xs font-bold text-primary'>
                  {step}
                </span>
                <h3 className='font-semibold text-lg'>{title}</h3>
                <p className='mt-1 text-muted-foreground'>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className='px-6 py-20'>
        <div className='mx-auto max-w-2xl rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-lg'>
          <h2 className='text-3xl font-extrabold tracking-tight'>
            Ready to plan your perfect holiday?
          </h2>
          <p className='mt-4 text-primary-foreground/80'>
            Join Kino Calendars and start organising every trip — from a long weekend to a world tour.
          </p>
          <Button
            size='lg'
            variant='secondary'
            className='mt-8'
            asChild
          >
            <Link href='/signup'>
              Create your free account <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className='border-t px-6 py-8 text-center text-sm text-muted-foreground'>
        <p>© {new Date().getFullYear()} Kino Calendars. Made for travellers.</p>
      </footer>

    </div>
  );
}
