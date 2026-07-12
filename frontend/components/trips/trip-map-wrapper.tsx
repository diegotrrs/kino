'use client';
import dynamic          from 'next/dynamic';
import type { TripMapData } from './trip-map';

const TripMap = dynamic(
  () => import('./trip-map').then((m) => m.TripMap),
  { ssr: false },
);

export const TripMapWrapper = ({ data }: { data: TripMapData }) => (
  <TripMap data={data} />
);
