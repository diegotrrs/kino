import { Separator }      from '@/components/ui/separator';
import { getTranslations } from 'next-intl/server';
import Link                from 'next/link';

const AboutPage = async () => {
  const t = await getTranslations('about');

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
              {t('title')}
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              {t('subtitle')}
            </p>
          </div>

          <Separator />

          <div className='space-y-1'>
            <p className='text-sm'>
              {t('builtBy')}{' '}
              <span className='font-medium'>Diego T.</span>
            </p>
            <p className='text-sm text-muted-foreground'>
              {t('contact')}{' '}
              <a
                href='mailto:diego.torres.arguedas@gmail.com'
                className='underline underline-offset-4 hover:text-foreground'
              >
                diego.torres.arguedas@gmail.com
              </a>
            </p>
          </div>

          <Separator />

          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>{t('inspiredBy')}</h3>
            <div className='flex flex-wrap gap-2'>
              <Link
                href='https://www.shadcn.io/template/robskinney-shadcn-ui-fullcalendar-example'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
              >
                robskinney&apos;s calendar example app
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
