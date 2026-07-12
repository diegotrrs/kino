export type TripPin = {
  id: number;
  label: string;
  coords: [number, number];
};

export type TripStop = {
  pinId: number;
  place: string;
  days: number;
  travelFromPrev?: string; // e.g. "Drive (~3h)", "Fly (~1h)"
};

export type TripMapData = {
  center: [number, number];
  zoom: number;
  pins: TripPin[];
  itinerary: string;
  stops: TripStop[];
};

export type Trip = {
  slug: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  photos: [string, string, string];
  description: string;
  website: string;
  map?: TripMapData;
};

export const TRIPS: Trip[] = [
  {
    slug: 'costa-rica',
    title: 'Costa Rica',
    subtitle: 'The Perfect 2-Week Adventure',
    thumbnail: '/trips/photos/costa-rica/costa-rica-thumb.avif',
    photos: [
      '/trips/photos/costa-rica/costa-rica-1.avif',
      '/trips/photos/costa-rica/costa-rica-2.avif',
      '/trips/photos/costa-rica/costa-rica-3.avif',
    ],
    description: 'From cloud forests and volcanic peaks to Pacific beaches and Caribbean shores, Costa Rica packs an astonishing variety of landscapes into a tiny country. Two weeks gives you enough time to explore the Arenal volcano, zip-line through Monteverde\'s cloud forest canopy, and relax on the Nicoya Peninsula\'s golden beaches.',
    website: 'https://www.visitcostarica.com',
    map: {
      center: [9.9, -84.2],
      zoom: 7,
      pins: [
        { id: 1, label: 'San José',          coords: [9.9281,  -84.0907] },
        { id: 2, label: 'Arenal Volcano',    coords: [10.4630, -84.7030] },
        { id: 3, label: 'Monteverde',        coords: [10.3007, -84.8269] },
        { id: 4, label: 'Manuel Antonio',   coords: [9.3894,  -84.1741] },
        { id: 5, label: 'Tamarindo',         coords: [10.2993, -85.8373] },
      ],
      itinerary:
        'Fly into San José and spend 2 days exploring the city and its museums (1). ' +
        'Head north to the Arenal Volcano area for 3 nights of hot springs and jungle hikes (2). ' +
        'Drive to Monteverde for 2 nights to zip-line through the cloud forest canopy (3). ' +
        'Drop south to Manuel Antonio for 3 nights of beach and wildlife (4). ' +
        'Finish with 3 nights in Tamarindo on the Nicoya Peninsula before flying home (5).',
      stops: [
        { pinId: 1, place: 'San José',         days: 2 },
        { pinId: 2, place: 'Arenal Volcano',   days: 3, travelFromPrev: 'Drive (~3h)' },
        { pinId: 3, place: 'Monteverde',        days: 2, travelFromPrev: 'Drive (~3h via Tilarán)' },
        { pinId: 4, place: 'Manuel Antonio',   days: 3, travelFromPrev: 'Drive (~4h)' },
        { pinId: 5, place: 'Tamarindo',         days: 3, travelFromPrev: 'Drive (~3h)' },
      ],
    },
  },
  {
    slug: 'albania',
    title: 'Albania',
    subtitle: "Europe's Hidden Riviera",
    thumbnail: '/trips/photos/albania/albania-thumb.avif',
    photos: [
      '/trips/photos/albania/albania-1.avif',
      '/trips/photos/albania/albania-2.avif',
      '/trips/photos/albania/albania-3.avif',
    ],
    description: 'Albania\'s Riviera stretches along some of the most dramatic coastline in the Mediterranean — turquoise water, old castles, and villages that time forgot, all without the tourist crowds of its neighbours. The UNESCO World Heritage city of Gjirokastër and the ancient ruins of Butrint are just a short drive inland.',
    website: 'https://albania.al',
    map: {
      center: [41.0, 20.0],
      zoom: 7,
      pins: [
        { id: 1, label: 'Tirana',        coords: [41.3275, 19.8187] },
        { id: 2, label: 'Berat',         coords: [40.7058, 19.9522] },
        { id: 3, label: 'Gjirokastër',   coords: [40.0758, 20.1403] },
        { id: 4, label: 'Butrint',       coords: [39.7444, 20.0208] },
        { id: 5, label: 'Sarandë',       coords: [39.8751, 20.0025] },
        { id: 6, label: 'Vlorë',         coords: [40.4667, 19.4833] },
      ],
      itinerary:
        'Arrive in Tirana and spend 2 days exploring the colourful capital (1). ' +
        'Drive south to Berat, the UNESCO "City of a Thousand Windows", for a night (2). ' +
        'Continue to Gjirokastër to walk its Ottoman old town and castle (3). ' +
        'Stop at the ancient ruins of Butrint before reaching the coast (4). ' +
        'Spend 3 nights in Sarandë, day-tripping along the Riviera beaches (5). ' +
        'Head north along the coast to Vlorë for your final night before flying home (6).',
      stops: [
        { pinId: 1, place: 'Tirana',      days: 2 },
        { pinId: 2, place: 'Berat',        days: 2, travelFromPrev: 'Drive (~2h)' },
        { pinId: 3, place: 'Gjirokastër', days: 2, travelFromPrev: 'Drive (~2h)' },
        { pinId: 4, place: 'Sarandë',     days: 3, travelFromPrev: 'Drive (~1h, includes Butrint day trip)' },
        { pinId: 5, place: 'Vlorë',       days: 2, travelFromPrev: 'Drive (~2h)' },
      ],
    },
  },
  {
    slug: 'rwanda',
    title: 'Rwanda',
    subtitle: 'Africa\'s Rising Star',
    thumbnail: '/trips/photos/rwanda/rwanda-thumb.avif',
    photos: [
      '/trips/photos/rwanda/rwanda-1.avif',
      '/trips/photos/rwanda/rwanda-2.avif',
      '/trips/photos/rwanda/rwanda-3.avif',
    ],
    description: 'Rwanda has reinvented itself as one of Africa\'s most compelling destinations — immaculately clean Kigali, world-class gorilla trekking in Volcanoes National Park, and a warmth of welcome that surprises every visitor. The country is as safe as anywhere in Europe and easier to navigate than you\'d expect.',
    website: 'https://www.visitrwanda.com',
    map: {
      center: [-1.9, 29.9],
      zoom: 8,
      pins: [
        { id: 1, label: 'Kigali',                  coords: [-1.9441,  30.0619] },
        { id: 2, label: 'Volcanoes National Park',  coords: [-1.4833,  29.5667] },
        { id: 3, label: 'Lake Kivu / Gisenyi',      coords: [-1.7008,  29.2564] },
        { id: 4, label: 'Nyungwe Forest',           coords: [-2.4833,  29.1500] },
        { id: 5, label: 'Akagera National Park',    coords: [-1.9000,  30.6833] },
      ],
      itinerary:
        'Land in Kigali and spend 2 days touring the Genocide Memorial and vibrant city markets (1). ' +
        'Head northwest to Volcanoes National Park for 2 nights of gorilla trekking at dawn (2). ' +
        'Relax on the shores of Lake Kivu in Gisenyi for a night (3). ' +
        'Drive south to Nyungwe Forest for chimpanzee tracking and canopy walks (4). ' +
        'Return east to Akagera for a classic Big Five safari before flying out of Kigali (5).',
      stops: [
        { pinId: 1, place: 'Kigali',                 days: 2 },
        { pinId: 2, place: 'Volcanoes National Park', days: 2, travelFromPrev: 'Drive (~2.5h)' },
        { pinId: 3, place: 'Gisenyi / Lake Kivu',     days: 2, travelFromPrev: 'Drive (~1h)' },
        { pinId: 4, place: 'Nyungwe Forest',          days: 2, travelFromPrev: 'Drive (~5h)' },
        { pinId: 5, place: 'Akagera National Park',   days: 2, travelFromPrev: 'Drive via Kigali (~6h)' },
      ],
    },
  },
  {
    slug: 'wales',
    title: 'Wales',
    subtitle: 'Castles, Coast & Mountains',
    thumbnail: '/trips/photos/wales/wales-thumb.avif',
    photos: [
      '/trips/photos/wales/wales-1.avif',
      '/trips/photos/wales/wales-2.avif',
      '/trips/photos/wales/wales-3.avif',
    ],
    description: 'Wales has more castles per square mile than almost anywhere on earth, a language that has survived for over a thousand years, and national parks that rival anything in Britain for wild beauty. Walk the Pembrokeshire Coast Path, climb Snowdon at dawn, and end each day in a cosy country pub.',
    website: 'https://www.visitwales.com',
    map: {
      center: [52.4, -3.9],
      zoom: 7,
      pins: [
        { id: 1, label: 'Cardiff',               coords: [51.4816, -3.1791] },
        { id: 2, label: 'Pembrokeshire Coast',   coords: [51.8333, -5.0000] },
        { id: 3, label: 'Brecon Beacons',        coords: [51.8833, -3.4333] },
        { id: 4, label: 'Aberystwyth',           coords: [52.4153, -4.0829] },
        { id: 5, label: 'Snowdonia',             coords: [53.0685, -3.8731] },
        { id: 6, label: 'Caernarfon',            coords: [53.1386, -4.2769] },
      ],
      itinerary:
        'Start in Cardiff for 2 nights — explore the castle and the Victorian arcades (1). ' +
        'Drive west to Pembrokeshire for 3 nights of coastal walking and sea-kayaking (2). ' +
        'Head east into the Brecon Beacons for wild hiking and waterfalls (3). ' +
        'Stop in Aberystwyth on the coast for a night and the funicular railway (4). ' +
        'Enter Snowdonia and hike or take the mountain railway to the Snowdon summit (5). ' +
        'Finish in Caernarfon to walk the most impressive castle in Wales (6).',
      stops: [
        { pinId: 1, place: 'Cardiff',             days: 2 },
        { pinId: 2, place: 'Pembrokeshire',        days: 3, travelFromPrev: 'Drive (~2h)' },
        { pinId: 3, place: 'Brecon Beacons',       days: 2, travelFromPrev: 'Drive (~1.5h)' },
        { pinId: 4, place: 'Aberystwyth',          days: 1, travelFromPrev: 'Drive (~2h)' },
        { pinId: 5, place: 'Snowdonia',            days: 2, travelFromPrev: 'Drive (~1.5h)' },
        { pinId: 6, place: 'Caernarfon',           days: 1, travelFromPrev: 'Drive (~30min)' },
      ],
    },
  },
  {
    slug: 'guatemala',
    title: 'Guatemala',
    subtitle: 'Land of Volcanoes & Lakes',
    thumbnail: '/trips/photos/guatemala/guatemala-thumb.avif',
    photos: [
      '/trips/photos/guatemala/guatemala-1.avif',
      '/trips/photos/guatemala/guatemala-2.avif',
      '/trips/photos/guatemala/guatemala-3.avif',
    ],
    description: 'Atitlán is often described as the most beautiful lake in the world, ringed by towering volcanoes and Mayan villages where traditional life continues unchanged. Guatemala\'s colonial capital Antigua, with its colourful facades and cobblestone streets, makes the perfect base before heading into the highlands.',
    website: 'https://visitguatemala.com',
    map: {
      center: [15.3, -90.4],
      zoom: 7,
      pins: [
        { id: 1, label: 'Guatemala City',      coords: [14.6349, -90.5069] },
        { id: 2, label: 'Antigua',             coords: [14.5586, -90.7295] },
        { id: 3, label: 'Lake Atitlán',        coords: [14.6893, -91.2096] },
        { id: 4, label: 'Chichicastenango',    coords: [14.9435, -91.1120] },
        { id: 5, label: 'Semuc Champey',       coords: [15.5340, -90.0626] },
        { id: 6, label: 'Tikal',              coords: [17.2220, -89.6237] },
      ],
      itinerary:
        'Arrive in Guatemala City and head straight out to explore the city (1). ' +
        'Spend 3 nights in colonial Antigua, hiking Volcán Acatenango for sunrise views (2). ' +
        'Journey to Lake Atitlán for 3 nights among volcano-ringed Mayan villages (3). ' +
        'Visit the famous Thursday market in Chichicastenango for textiles and crafts (4). ' +
        'Head north to the turquoise limestone pools of Semuc Champey (5). ' +
        'End with 2 nights at the jungle ruins of Tikal, the greatest Mayan city (6).',
      stops: [
        { pinId: 1, place: 'Guatemala City', days: 1 },
        { pinId: 2, place: 'Antigua',         days: 3, travelFromPrev: 'Drive (~1h)' },
        { pinId: 3, place: 'Lake Atitlán',    days: 3, travelFromPrev: 'Drive (~1.5h)' },
        { pinId: 4, place: 'Chichicastenango', days: 1, travelFromPrev: 'Drive (~1h)' },
        { pinId: 5, place: 'Semuc Champey',   days: 2, travelFromPrev: 'Drive (~5h)' },
        { pinId: 6, place: 'Tikal',           days: 2, travelFromPrev: 'Drive (~5h)' },
      ],
    },
  },
  {
    slug: 'thailand',
    title: 'Thailand',
    subtitle: 'Temples, Islands & Street Food',
    thumbnail: '/trips/photos/thailand/thailand-thumb.avif',
    photos: [
      '/trips/photos/thailand/thailand-1.avif',
      '/trips/photos/thailand/thailand-2.avif',
      '/trips/photos/thailand/thailand-3.avif',
    ],
    description: 'Thailand effortlessly blends ancient temples, world-class street food, and some of the most beautiful islands in Southeast Asia. Explore Bangkok\'s Grand Palace in the morning, catch a night train north to Chiang Mai\'s temples and night markets, then island-hop through the emerald waters of the Andaman Sea.',
    website: 'https://www.tourismthailand.org',
    map: {
      center: [13.0, 101.0],
      zoom: 6,
      pins: [
        { id: 1, label: 'Bangkok',       coords: [13.7563, 100.5018] },
        { id: 2, label: 'Chiang Mai',    coords: [18.7883,  98.9853] },
        { id: 3, label: 'Pai',           coords: [19.3583,  98.4428] },
        { id: 4, label: 'Koh Samui',     coords: [ 9.5349, 100.0636] },
        { id: 5, label: 'Koh Phangan',   coords: [ 9.7333, 100.0167] },
        { id: 6, label: 'Phuket',        coords: [ 7.8804,  98.3923] },
      ],
      itinerary:
        'Arrive in Bangkok for 3 nights — Grand Palace, Wat Pho, and legendary street food (1). ' +
        'Fly north to Chiang Mai for 3 nights of temple visits and night markets (2). ' +
        'Rent a scooter and escape to the mountain town of Pai for 2 nights (3). ' +
        'Fly south to Koh Samui for 3 nights of beaches and waterfall hikes (4). ' +
        'Take the ferry to Koh Phangan for 2 nights of diving and quieter coves (5). ' +
        'Finish with 3 nights in Phuket before your flight home (6).',
      stops: [
        { pinId: 1, place: 'Bangkok',      days: 3 },
        { pinId: 2, place: 'Chiang Mai',   days: 3, travelFromPrev: 'Fly (~1h)' },
        { pinId: 3, place: 'Pai',           days: 2, travelFromPrev: 'Bus (~3h)' },
        { pinId: 4, place: 'Koh Samui',    days: 3, travelFromPrev: 'Fly from Chiang Mai (~1h)' },
        { pinId: 5, place: 'Koh Phangan',  days: 2, travelFromPrev: 'Ferry (~30min)' },
        { pinId: 6, place: 'Phuket',        days: 3, travelFromPrev: 'Ferry & bus (~4h)' },
      ],
    },
  },
  {
    slug: 'japan',
    title: 'Japan',
    subtitle: 'From Tokyo to Kyoto',
    thumbnail: '/trips/photos/japan/japan-thumb.avif',
    photos: [
      '/trips/photos/japan/japan-1.avif',
      '/trips/photos/japan/japan-2.avif',
      '/trips/photos/japan/japan-3.avif',
    ],
    description: 'Japan is a country of breathtaking contrasts — neon-lit Tokyo versus serene Kyoto, bullet trains versus centuries-old temples, cherry blossoms versus snow-capped Fuji. The Shinkansen makes it possible to experience the best of both worlds in a single trip, with dozens of extraordinary stops in between.',
    website: 'https://www.japan.travel',
    map: {
      center: [35.5, 136.5],
      zoom: 5,
      pins: [
        { id: 1, label: 'Tokyo',      coords: [35.6762, 139.6503] },
        { id: 2, label: 'Nikkō',      coords: [36.7198, 139.6982] },
        { id: 3, label: 'Hakone',     coords: [35.2322, 139.1069] },
        { id: 4, label: 'Kyoto',      coords: [35.0116, 135.7681] },
        { id: 5, label: 'Nara',       coords: [34.6851, 135.8048] },
        { id: 6, label: 'Osaka',      coords: [34.6937, 135.5023] },
        { id: 7, label: 'Hiroshima',  coords: [34.3853, 132.4553] },
      ],
      itinerary:
        'Spend 4 nights in Tokyo exploring Shibuya, Shinjuku, and Asakusa (1). ' +
        'Day-trip north to Nikkō for its ornate shrines and mountain scenery (2). ' +
        'Head to Hakone for a night with views of Mount Fuji over the lake (3). ' +
        'Take the Shinkansen to Kyoto for 4 nights of temples, geisha districts, and bamboo groves (4). ' +
        'Make a half-day trip to Nara to feed the sacred deer and see Tōdai-ji (5). ' +
        'End in Osaka for 2 nights of street food and vibrant nightlife (6). ' +
        'Optional final stop: Hiroshima and Miyajima island, a day-trip from Osaka (7).',
      stops: [
        { pinId: 1, place: 'Tokyo',     days: 4 },
        { pinId: 2, place: 'Nikkō',     days: 1, travelFromPrev: 'Train (~2h)' },
        { pinId: 3, place: 'Hakone',    days: 1, travelFromPrev: 'Train (~2h via Odawara)' },
        { pinId: 4, place: 'Kyoto',     days: 4, travelFromPrev: 'Shinkansen (~2.5h)' },
        { pinId: 5, place: 'Nara',      days: 1, travelFromPrev: 'Train (~45min)' },
        { pinId: 6, place: 'Osaka',     days: 2, travelFromPrev: 'Train (~30min)' },
        { pinId: 7, place: 'Hiroshima', days: 1, travelFromPrev: 'Shinkansen (~45min)' },
      ],
    },
  },
  {
    slug: 'norway',
    title: 'Norway',
    subtitle: 'Escape the Summer Heat',
    thumbnail: '/trips/photos/norway/norway-thumb.avif',
    photos: [
      '/trips/photos/norway/norway-1.avif',
      '/trips/photos/norway/norway-2.avif',
      '/trips/photos/norway/norway-3.avif',
    ],
    description: 'In summer, Norway\'s fjords glow under the midnight sun, and hiking trails snake up mountains above mirror-calm water. Cruise through the Geirangerfjord, ride the famous Flåm Railway through impossibly steep valley walls, and camp under skies that never fully darken in June.',
    website: 'https://www.visitnorway.com',
    map: {
      center: [62.0, 8.0],
      zoom: 5,
      pins: [
        { id: 1, label: 'Oslo',         coords: [59.9139,  10.7522] },
        { id: 2, label: 'Bergen',       coords: [60.3913,   5.3221] },
        { id: 3, label: 'Flåm',         coords: [60.8630,   7.1168] },
        { id: 4, label: 'Geirangerfjord', coords: [62.1004, 7.2051] },
        { id: 5, label: 'Ålesund',      coords: [62.4722,   6.1495] },
        { id: 6, label: 'Tromsø',       coords: [69.6492,  18.9553] },
      ],
      itinerary:
        'Arrive in Oslo for 2 nights — visit the Viking Ship Museum and waterfront Aker Brygge (1). ' +
        'Take the scenic train to Bergen for 2 nights, gateway to the fjords (2). ' +
        'Board the famous Flåm Railway and cruise the Nærøyfjord for a night in Flåm (3). ' +
        'Drive the Eagle Road up to Geirangerfjord, one of Norway\'s most dramatic viewpoints (4). ' +
        'Continue to the art nouveau city of Ålesund for a night on the Atlantic coast (5). ' +
        'Fly north to Tromsø for 2 nights under the midnight sun — or Northern Lights in winter (6).',
      stops: [
        { pinId: 1, place: 'Oslo',           days: 2 },
        { pinId: 2, place: 'Bergen',         days: 2, travelFromPrev: 'Train (~6.5h, Bergen Railway)' },
        { pinId: 3, place: 'Flåm',           days: 2, travelFromPrev: 'Bus & ferry (~4h, Norway in a Nutshell)' },
        { pinId: 4, place: 'Geirangerfjord', days: 1, travelFromPrev: 'Bus & ferry (~4h)' },
        { pinId: 5, place: 'Ålesund',        days: 2, travelFromPrev: 'Drive (~1.5h)' },
        { pinId: 6, place: 'Tromsø',         days: 2, travelFromPrev: 'Fly (~1.5h)' },
      ],
    },
  },
];

export const getTripBySlug = (slug: string): Trip | undefined =>
  TRIPS.find((t) => t.slug === slug);
