import { FeedbackForm } from '@/components/feedback/feedback-form';
import { Wishlist }     from '@/components/feedback/wishlist';
import { Separator }    from '@/components/ui/separator';
import { cookies }      from 'next/headers';
import { redirect }     from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

async function getWishlist(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/wishlist/`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return [];
  return res.json();
}

export default async function FeedbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const wishlistItems = await getWishlist(token);

  return (
    <div className='py-4'>
      <div className='w-full px-5 space-y-8'>

        <div className='space-y-1'>
          <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
            Feedback
          </h2>
          <p className='text-xs md:text-sm text-muted-foreground select-none cursor-default'>
            Help us improve Kino.
          </p>
        </div>

        <Separator />

        <section className='space-y-3'>
          <div className='space-y-0'>
            <h3 className='text-base font-semibold tracking-tight'>Share your feedback</h3>
            <p className='text-xs text-muted-foreground'>
              Tell us what&apos;s working, what&apos;s not, or anything else on your mind.
            </p>
          </div>
          <FeedbackForm />
        </section>

        <Separator />

        <section className='space-y-3'>
          <div className='space-y-0'>
            <h3 className='text-base font-semibold tracking-tight'>Wishlist</h3>
            <p className='text-xs text-muted-foreground'>
              Vote for the features you&apos;d like to see next.
            </p>
          </div>
          <Wishlist items={wishlistItems} />
        </section>

      </div>
    </div>
  );
}
