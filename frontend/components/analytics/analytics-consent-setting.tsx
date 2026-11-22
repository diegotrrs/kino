'use client';
import { Separator }       from '@/components/ui/separator';
import { Switch }          from '@/components/ui/switch';
import {
  type ConsentStatus,
  getConsentStatus,
  setConsent
}                          from '@/lib/analytics/consent';
import { useTranslations } from 'next-intl';
import {
  type ReactElement,
  useEffect,
  useId,
  useState
}                          from 'react';

// The banner's choice, changeable later. Hidden where analytics isn't configured.
export const AnalyticsConsentSetting = (): ReactElement | null => {
  const t = useTranslations('analytics');
  const id = useId();
  const [status, setStatus] = useState<ConsentStatus | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setStatus(getConsentStatus()), []);

  if (status === null) {
    return null;
  }

  const handleChange = (isGranted: boolean): void => {
    setConsent(isGranted);
    setStatus(isGranted ? 'granted' : 'denied');
  };

  return (
    <>
      <Separator />
      <div className='space-y-2'>
        <h3 id={`${id}-title`} className='text-sm font-medium'>{t('label')}</h3>
        <div className='flex items-center justify-between gap-4 rounded-md border px-4 py-3'>
          <span className='text-sm'>{t('settingsSwitch')}</span>
          <Switch aria-labelledby={`${id}-title`} checked={status === 'granted'} onCheckedChange={handleChange} />
        </div>
        <p className='text-xs text-muted-foreground'>{t('settingsHint')}</p>
      </div>
    </>
  );
};
