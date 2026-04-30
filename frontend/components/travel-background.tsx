export const TravelBackground = () => {
  const g = {
    stroke: 'currentColor' as const,
    fill: 'none' as const,
    strokeWidth: '1.4',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <div
      className='absolute inset-0 pointer-events-none select-none text-slate-300 dark:text-slate-700'
      aria-hidden='true'
    >
      <svg className='w-full h-full' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <pattern
            id='travel-bg'
            x='0'
            y='0'
            width='200'
            height='200'
            patternUnits='userSpaceOnUse'
          >
            {/* Airplane — top left */}
            <g transform='translate(4, 4)' {...g}>
              <path d='M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z' />
            </g>

            {/* Sun — top right */}


            {/* Palm tree — top centre */}
            <g transform='translate(82, 4)' {...g}>
              <path d='M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4' />
              <path d='M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3' />
              <path d='M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35' />
              <path d='M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14' />
            </g>

            <g transform='translate(140, 4)' {...g}>
              <circle cx='12' cy='12' r='4' />
              <path d='M12 2v2' />
              <path d='M12 20v2' />
              <path d='m4.93 4.93 1.41 1.41' />
              <path d='m17.66 17.66 1.41 1.41' />
              <path d='M2 12h2' />
              <path d='M20 12h2' />
              <path d='m6.34 17.66-1.41 1.41' />
              <path d='m19.07 4.93-1.41 1.41' />
            </g>

            {/* Landmark — middle left */}
            <g transform='translate(4, 64)' {...g}>
              <path d='M10 18v-7' />
              <path d='M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z' />
              <path d='M14 18v-7' />
              <path d='M18 18v-7' />
              <path d='M3 22h18' />
              <path d='M6 18v-7' />
            </g>

            {/* Compass — centre */}
            <g transform='translate(82, 64)' {...g}>
              <circle cx='12' cy='12' r='10' />
              <path d='m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z' />
            </g>

            {/* Camera — middle right */}
            <g transform='translate(140, 64)' {...g}>
              <path d='M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z' />
              <circle cx='12' cy='13' r='3' />
            </g>

            {/* Tree pin — bottom left */}
            <g transform='translate(4, 124)' {...g}>
              <path d='M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z' />
              <path d='M7 16v6' />
              <path d='M13 19v3' />
              <path d='M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5' />
            </g>

            {/* Suitcase — middle right */}
            <g transform='translate(82, 124)' {...g}>
              <rect x='3' y='6' width='18' height='14' rx='2' />
              <path d='M8 6L8 4Q8 2 12 2Q16 2 16 4L16 6' />
              <line x1='3' y1='13' x2='21' y2='13' />
              <line x1='12' y1='6' x2='12' y2='20' />
            </g>

            {/* Icecream — bottom right */}
            <g transform='translate(140, 124)' {...g}>
              <path d='m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11' />
              <path d='M17 7A5 5 0 0 0 7 7' />
              <path d='M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4' />
            </g>
          </pattern>
        </defs>
        <rect width='100%' height='100%' fill='url(#travel-bg)' />
      </svg>
    </div>
  );
}
