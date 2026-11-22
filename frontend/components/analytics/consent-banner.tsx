'use client';
import { Button }          from '@/components/ui/button';
import {
  type ConsentStatus,
  getConsentStatus,
  setConsent
}                          from '@/lib/analytics/consent';
import { useTranslations } from 'next-intl';
import Link                from 'next/link';
import {
  type ReactElement,
  useEffect,
  useState
}                          from 'react';

// Asks once, on any page, until the visitor answers. Above the phone's bottom navigation.
export const ConsentBanner = (): ReactElement | null => {
  const t = useTranslations('analytics');
  const [status, setStatus] = useState<ConsentStatus | null>(null);

  // PostHog keeps the answer in the browser, so it's only known after hydration
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setStatus(getConsentStatus()), []);

  if (status !== 'pending') {
    return null;
  }

  const handleChoice = (isGranted: boolean): void => {
    setConsent(isGranted);
    setStatus(isGranted ? 'granted' : 'denied');
  };

  return (
    <section
      aria-label={t('label')}
      className='fixed inset-x-4 bottom-20 z-[60] mx-auto max-w-md rounded-lg border bg-card p-4 text-card-foreground shadow-lg md:inset-x-auto md:left-4 md:bottom-4'
    >
      <p className='text-sm'>
        {t('bannerText')}{' '}
        <Link href='/about#privacy' className='underline underline-offset-4 hover:text-foreground'>
          {t('learnMore')}
        </Link>
      </p>
      <div className='mt-3 flex justify-end gap-2'>
        <Button variant='outline' size='sm' onClick={() => handleChoice(false)}>{t('decline')}</Button>
        <Button size='sm' onClick={() => handleChoice(true)}>{t('accept')}</Button>
      </div>
    </section>
  );
};
