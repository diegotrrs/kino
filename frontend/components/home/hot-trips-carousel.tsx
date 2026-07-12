'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
}                    from '@/components/ui/carousel';
import { TRIPS }     from '@/app/(marketing)/trips/trips-data';
import Image         from 'next/image';
import Link          from 'next/link';

export const HotTripsCarousel = () => {
  return (
    <div className='sm:px-10'>
    <Carousel
      opts={{ align: 'start', loop: false }}
      className='w-full'
    >
      <CarouselContent className='-ml-2'>
        {TRIPS.map((trip) => (
          <CarouselItem key={trip.slug} className='pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5'>
            <Link href={`/trips/${trip.slug}`} className='block group'>
              <div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
                <div className='relative aspect-[3/2] w-full overflow-hidden'>
                  <Image
                    src={trip.thumbnail}
                    alt={trip.title}
                    fill
                    className='object-cover transition-transform duration-300 group-hover:scale-105'
                    sizes='(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw'
                  />
                </div>
                <div className='p-2'>
                  <p className='font-semibold text-xs leading-tight'>{trip.title}</p>
                  <p className='text-[10px] text-muted-foreground mt-0.5 line-clamp-1'>{trip.subtitle}</p>
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
