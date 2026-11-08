import CalendarNoSSR      from '@/components/calendar-no-ssr';
import { HotTripsCarousel } from '@/components/home/hot-trips-carousel';
import { Button }         from '@/components/ui/button';
import { EventsProvider } from '@/context/events-context';
import {
  CalendarDays,
  CalendarCheck2,
  Globe2,
  Sparkles,
  ArrowRight
}                         from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link               from 'next/link';

const Home = async () => {
  const t = await getTranslations('marketing.landing');

  const features = [
    { icon: CalendarDays,   title: t('feature1Title'), description: t('feature1Desc') },
    { icon: Globe2,         title: t('feature2Title'), description: t('feature2Desc') },
    { icon: CalendarCheck2, title: t('feature3Title'), description: t('feature3Desc') },
    { icon: Sparkles,       title: t('feature4Title'), description: t('feature4Desc') },
  ];

  const steps = [
    { step: '01', title: t('step1Title'), body: t('step1Body') },
    { step: '02', title: t('step2Title'), body: t('step2Body') },
    { step: '03', title: t('step3Title'), body: t('step3Body') },
  ];

  return (
    <div className='flex flex-col'>
      <section className='px-6 py-20 md:py-28 text-center'>
        <p className='mb-4 font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'>
          {t('tagline')}
        </p>
        <h1 className='mx-auto max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-tighter md:text-7xl'>
          {t('hero')}{' '}
          <span className='text-primary'>{t('heroHighlight')}</span>
        </h1>
        <p className='mx-auto mt-6 max-w-xl text-lg text-muted-foreground'>
          {t('subhero')}
        </p>
        <div className='mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
          <Button size='lg' asChild>
            <Link href='/signup'>
              {t('getStartedFree')} <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link href='/login'>{t('signIn')}</Link>
          </Button>
        </div>
      </section>

      <section className='px-6 pb-20'>
        <div className='mx-auto max-w-5xl'>
          <div className='mb-8 text-center'>
            <h2 className='text-3xl font-extrabold tracking-tighter md:text-4xl'>{t('tryNowTitle')}</h2>
            <p className='mt-2 text-muted-foreground'>
              {t('tryNowSubtitle')}
            </p>
          </div>
          <div className='rounded-lg border bg-card overflow-hidden p-4 md:p-6'>
            <EventsProvider>
              <CalendarNoSSR />
            </EventsProvider>
          </div>
        </div>
      </section>

      <section className='border-y border-dashed bg-card/60 px-6 py-20'>
        <div className='mx-auto max-w-5xl'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-extrabold tracking-tighter md:text-4xl'>
              {t('featuresTitle')}
            </h2>
            <p className='mt-2 text-muted-foreground'>
              {t('featuresSubtitle')}
            </p>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className='rounded-lg border bg-card p-6'
              >
                <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-teal-soft'>
                  <Icon className='h-5 w-5 text-teal' />
                </div>
                <h3 className='mb-2 text-lg font-bold tracking-tight'>{title}</h3>
                <p className='text-sm text-muted-foreground'>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='px-6 py-20'>
        <div className='mx-auto max-w-3xl'>
          <div className='mb-12 text-center'>
            <h2 className='text-3xl font-extrabold tracking-tighter md:text-4xl'>
              {t('stepsTitle')}
            </h2>
          </div>
          <ol className='relative border-l border-border pl-8 space-y-10'>
            {steps.map(({ step, title, body }) => (
              <li key={step} className='relative'>
                <span className='absolute -left-[2.85rem] flex h-9 w-9 items-center justify-center rounded-full border bg-card font-mono text-xs font-medium text-primary'>
                  {step}
                </span>
                <h3 className='text-xl font-bold tracking-tight'>{title}</h3>
                <p className='mt-1 text-muted-foreground'>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='px-6 py-20'>
        <div className='mx-auto max-w-5xl'>
          <div className='mb-8 text-center'>
            <h2 className='text-3xl font-extrabold tracking-tighter md:text-4xl'>
              {t('hotTripsTitle')}
            </h2>
            <p className='mt-2 text-muted-foreground'>
              {t('hotTripsSubtitle')}
            </p>
          </div>
          <HotTripsCarousel />
        </div>
      </section>

      <section className='px-6 py-20'>
        <div className='mx-auto max-w-2xl rounded-lg bg-foreground px-8 py-16 text-center text-background'>
          <h2 className='text-4xl font-extrabold tracking-tighter'>
            {t('ctaTitle')}
          </h2>
          <p className='mt-4 text-background/70'>
            {t('ctaSubtitle')}
          </p>
          <Button
            size='lg'
            className='mt-8'
            asChild
          >
            <Link href='/signup'>
              {t('ctaButton')} <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </section>

      <footer className='border-t px-6 py-8 text-center text-sm text-muted-foreground'>
        <p>{t('footer', { year: new Date().getFullYear() })}</p>
      </footer>

    </div>
  );
}

export default Home;
