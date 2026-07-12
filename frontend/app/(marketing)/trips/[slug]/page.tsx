import { Button }             from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { getTranslations }   from 'next-intl/server';
import Image                 from 'next/image';
import Link                  from 'next/link';
import { TripMapWrapper }    from '@/components/trips/trip-map-wrapper';
import { notFound }          from 'next/navigation';
import { getTripBySlug, TRIPS } from '../trips-data';

export const generateStaticParams = () =>
  TRIPS.map((trip) => ({ slug: trip.slug }));

const TripPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const trip = getTripBySlug(slug);
  if (!trip) notFound();

  const t = await getTranslations('marketing.trips');

  return (
    <div className='flex flex-col'>
      <div className='mx-auto w-full max-w-3xl px-6 py-6'>
        <Link
          href='/home'
          className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6'
        >
          <ArrowLeft className='h-4 w-4' />
          {t('back')}
        </Link>

        <div className='space-y-2 mb-6'>
          <h1 className='text-3xl font-extrabold tracking-tight md:text-4xl'>
            {trip.title}
          </h1>
          <p className='text-lg text-muted-foreground'>{trip.subtitle}</p>
        </div>

        <div className='relative aspect-video w-full overflow-hidden rounded-xl mb-6'>
          <Image
            src={trip.photos[0]}
            alt={trip.title}
            fill
            className='object-cover'
            priority
          />
        </div>

        <p className='text-base leading-relaxed text-foreground mb-4'>
          {trip.description}
        </p>

        <a
          href={trip.website}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8'
        >
          <ExternalLink className='h-3.5 w-3.5' />
          {trip.website.replace(/^https?:\/\//, '')}
        </a>

        <div className='relative aspect-video w-full overflow-hidden rounded-xl mb-8'>
          <Image
            src={trip.photos[1]}
            alt={`${trip.title} — 2`}
            fill
            className='object-cover'
          />
        </div>

        <div className='flex justify-center mb-8'>
          <Button size='lg' asChild>
            <Link href={`/calendars/create?name=${encodeURIComponent(`${trip.title}: ${trip.subtitle}`)}`}>
              {t('planTrip', { title: trip.title })}
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>

        <div className='relative aspect-video w-full overflow-hidden rounded-xl'>
          <Image
            src={trip.photos[2]}
            alt={`${trip.title} — 3`}
            fill
            className='object-cover'
          />
        </div>

        {trip.map && (
          <div className='mt-10 space-y-3'>
            <h2 className='text-xl font-semibold tracking-tight'>{t('suggestedRoute')}</h2>
            <TripMapWrapper data={trip.map} />
          </div>
        )}

        <div className='flex justify-center mt-10'>
          <Button size='lg' asChild>
            <Link href={`/calendars/create?name=${encodeURIComponent(`${trip.title}: ${trip.subtitle}`)}`}>
              {t('planTrip', { title: trip.title })}
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripPage;
