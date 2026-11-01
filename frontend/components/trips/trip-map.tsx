'use client';
import 'leaflet/dist/leaflet.css';
import L               from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

export type TripPin = {
  id: number;
  label: string;
  coords: [number, number];
};

export type TripMapData = {
  center: [number, number];
  zoom: number;
  pins: TripPin[];
  itinerary: string;
};

const makeIcon = (n: number) =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:#E8542F;color:#fff;font-family:var(--font-mono),monospace;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)">${n}</div>`,
    iconSize:    [28, 28],
    iconAnchor:  [14, 14],
    popupAnchor: [0, -16],
  });

type Props = { data: TripMapData };

export const TripMap = ({ data }: Props) => (
  <div className='space-y-4'>
    <div className='rounded-xl overflow-hidden border' style={{ height: 380 }}>
      <MapContainer
        center={data.center}
        zoom={data.zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data.pins.map((pin) => (
          <Marker key={pin.id} position={pin.coords} icon={makeIcon(pin.id)}>
            <Popup>
              <span className='font-semibold'>{pin.id}. {pin.label}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>

    {/* Pin legend */}
    <div className='flex flex-wrap gap-x-4 gap-y-1.5'>
      {data.pins.map((pin) => (
        <div key={pin.id} className='flex items-center gap-1.5 text-sm'>
          <span className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground'>
            {pin.id}
          </span>
          <span className='text-muted-foreground'>{pin.label}</span>
        </div>
      ))}
    </div>

    {/* Itinerary narrative */}
    <p className='text-sm leading-relaxed text-muted-foreground'>
      {data.itinerary}
    </p>
  </div>
);
