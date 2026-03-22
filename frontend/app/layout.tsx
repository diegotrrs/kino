import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster }       from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kino Calendars — Plan Your Perfect Holiday',
  description: 'Create dedicated holiday calendars, map out every day of your trip, and never double-book a beach day again.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
