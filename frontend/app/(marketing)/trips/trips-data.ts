export type Trip = {
  slug: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  photos: [string, string, string];
  description: string;
  website: string;
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
  },
];

export const getTripBySlug = (slug: string): Trip | undefined =>
  TRIPS.find((t) => t.slug === slug);
