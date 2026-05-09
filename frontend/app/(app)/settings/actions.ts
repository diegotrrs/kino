'use server';
import { locales, type Locale } from '@/i18n/routing';
import { cookies }              from 'next/headers';
import { revalidatePath }       from 'next/cache';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const updateLocale = async (locale: Locale): Promise<void> => {
  if (!(locales as readonly string[]).includes(locale)) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set('locale', locale, {
    path: '/',
    sameSite: 'lax',
  });

  // Persist to DB if the user is logged in
  const token = cookieStore.get('token')?.value;
  if (token) {
    try {
      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (meRes.ok) {
        const user = await meRes.json();
        await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locale }),
        });
      }
    } catch {
      // Best-effort — cookie is already set so locale change still works
    }
  }

  revalidatePath('/', 'layout');
};
