'use server';
import { locales, type Locale } from '@/i18n/routing';
import { cookies }              from 'next/headers';
import { revalidatePath }       from 'next/cache';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const LOCALE_CURRENCY: Record<string, string> = {
  en: 'GBP',
  es: 'EUR',
  pt: 'EUR',
  de: 'EUR',
};

const patchUser = async (token: string, body: Record<string, string>): Promise<void> => {
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
        body: JSON.stringify(body),
      });
    }
  } catch {
    // Best-effort — cookie is already set so the change still works locally
  }
};

export const updateLocale = async (locale: Locale): Promise<void> => {
  if (!(locales as readonly string[]).includes(locale)) {
    return;
  }

  const cookieStore = await cookies();
  const inferredCurrency = LOCALE_CURRENCY[locale] ?? 'GBP';

  cookieStore.set('locale', locale, { path: '/', sameSite: 'lax' });
  cookieStore.set('currency', inferredCurrency, { path: '/', sameSite: 'lax' });

  const token = cookieStore.get('token')?.value;
  if (token) {
    await patchUser(token, { locale, currency: inferredCurrency });
  }

  revalidatePath('/', 'layout');
};

export const updateCurrency = async (currency: string): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set('currency', currency, { path: '/', sameSite: 'lax' });

  const token = cookieStore.get('token')?.value;
  if (token) {
    await patchUser(token, { currency });
  }

  revalidatePath('/', 'layout');
};
