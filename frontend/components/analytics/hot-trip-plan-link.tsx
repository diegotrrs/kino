'use client';
import { track }             from '@/lib/analytics/events';
import Link                  from 'next/link';
import {
  type ComponentProps,
  forwardRef
}                            from 'react';

type HotTripPlanLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { slug: string };

// A Hot Trip's "Plan this trip", recorded on the way to the create form
export const HotTripPlanLink = forwardRef<HTMLAnchorElement, HotTripPlanLinkProps>(({ slug, onClick, ...props }, ref) => (
  <Link
    ref={ref}
    href={`/calendars/create?trip=${slug}`}
    onClick={(event) => {
      track('hot_trip_cta_clicked', { hot_trip_slug: slug });
      onClick?.(event);
    }}
    {...props}
  />
));
HotTripPlanLink.displayName = 'HotTripPlanLink';
