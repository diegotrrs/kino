import './globals.css';
import { ThemeProvider }        from '@/components/theme-provider';
import { Toaster }              from '@/components/ui/toaster';
import { defaultLocale, locales } from '@/i18n/routing';
import type { Metadata }        from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages }          from 'next-intl/server';
import { cookies }              from 'next/headers';

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
    <html lang={locale} suppressHydrationWarning>
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
