import './globals.css';
import { ThemeProvider }        from '@/components/theme-provider';
import { Toaster }              from '@/components/ui/toaster';
import { defaultLocale, locales } from '@/i18n/routing';
import type { Metadata }        from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages }          from 'next-intl/server';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import { cookies }              from 'next/headers';

const displayFont = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const sansFont    = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const monoFont    = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Kino Calendars — Plan Your Perfect Holiday',
  description: 'Create dedicated holiday calendars, map out every day of your trip, and never double-book a beach day again.',
};

const RootLayout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value;
  const locale = (locales as readonly string[]).includes(raw ?? '') ? raw! : defaultLocale;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
