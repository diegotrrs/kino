import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL ?? 'http://localhost:8000',
  },
  devIndicators: {
    position: 'bottom-right',
  },
};

export default withNextIntl(nextConfig);
