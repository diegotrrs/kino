import { FeedbackForm }    from '@/components/feedback/feedback-form';
import { Wishlist }        from '@/components/feedback/wishlist';
import { Separator }       from '@/components/ui/separator';
import { getTranslations } from 'next-intl/server';
import { cookies }         from 'next/headers';
import { redirect }        from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const getWishlist = async (token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/wishlist/`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return [];
  return res.json();
}

const FeedbackPage = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const [wishlistItems, t] = await Promise.all([
    getWishlist(token),
    getTranslations('feedback'),
  ]);

  return (
    <div className='py-4'>
      <div className='w-full px-5 space-y-8'>

        <div className='space-y-1'>
          <h2 className='text-3xl font-extrabold tracking-tighter md:text-4xl select-none cursor-default'>
            {t('title')}
          </h2>
          <p className='text-xs md:text-sm text-muted-foreground select-none cursor-default'>
            {t('subtitle')}
          </p>
        </div>

        <Separator />

        <section className='space-y-3'>
          <div className='space-y-0'>
            <h3 className='text-base font-semibold tracking-tight'>{t('shareTitle')}</h3>
            <p className='text-xs text-muted-foreground'>
              {t('shareSubtitle')}
            </p>
          </div>
          <FeedbackForm />
        </section>

        <Separator />

        <section className='space-y-3'>
          <div className='space-y-0'>
            <h3 className='text-base font-semibold tracking-tight'>{t('wishlistTitle')}</h3>
            <p className='text-xs text-muted-foreground'>
              {t('wishlistSubtitle')}
            </p>
          </div>
          <Wishlist items={wishlistItems} />
        </section>

      </div>
    </div>
  );
};

export default FeedbackPage;
