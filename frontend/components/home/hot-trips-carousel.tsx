'use client';
import {
  TRIPS,
  type Trip
}                          from '@/app/(marketing)/trips/trips-data';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
}                          from '@/components/ui/carousel';
import { Stamp }           from '@/components/ui/stamp';
import { useTranslations } from 'next-intl';
import Image               from 'next/image';
import Link                from 'next/link';

const getTripDays = (trip: Trip): number =>
  trip.map?.stops.reduce((total, stop) => total + stop.days, 0) ?? 0;

export const HotTripsCarousel = () => {
  const t = useTranslations('postcard');

  return (
    <div className='sm:px-10'>
    <Carousel
      opts={{ align: 'start', loop: false }}
      className='w-full'
    >
      <CarouselContent className='-ml-2'>
        {TRIPS.map((trip) => (
          <CarouselItem key={trip.slug} className='pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5'>
            <Link href={`/trips/${trip.slug}`} className='block group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              <div className='rounded-md border bg-card p-1.5'>
                <div className='relative aspect-[3/2] w-full overflow-hidden rounded-sm'>
                  <Image
                    src={trip.thumbnail}
                    alt={trip.title}
                    fill
                    className='object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100'
                    sizes='(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw'
                  />
                  <Stamp className='absolute right-1.5 top-1.5 bg-card/90 px-1 py-0.5 text-[0.5rem] sm:text-[0.55rem]'>
                    {getTripDays(trip) ? t('days', { count: getTripDays(trip) }) : t('hot')}
                  </Stamp>
                </div>
                <div className='flex items-end justify-between gap-2 border-t border-dashed px-1 pb-0.5 pt-1.5 mt-1.5'>
                  <div className='min-w-0'>
                    <p className='font-display text-sm font-bold leading-tight tracking-tight truncate'>{trip.title}</p>
                    <p className='text-[10px] text-muted-foreground mt-0.5 line-clamp-1'>{trip.subtitle}</p>
                  </div>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className='hidden sm:flex' />
      <CarouselNext className='hidden sm:flex' />
    </Carousel>
    </div>
  );
};
