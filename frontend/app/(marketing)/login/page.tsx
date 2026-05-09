'use client';
import {
  login,
  type AuthState
}                          from '@/app/auth/actions';
import { Button }          from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
}                          from '@/components/ui/card';
import { Input }           from '@/components/ui/input';
import { Label }           from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import Link                from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState }  from 'react';

const LoginPage = () => {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '';
  const t = useTranslations('auth.login');

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className='flex flex-col gap-6'>
              {state.error && (
                <p className='text-sm text-destructive'>{state.error}</p>
              )}
              {redirect && <input type='hidden' name='redirect' value={redirect} />}
              <div className='grid gap-2'>
                <Label htmlFor='email'>{t('email')}</Label>
                <Input id='email' name='email' type='email' required />
                {state.fieldErrors?.email && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.email[0]}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>{t('password')}</Label>
                  <Link
                    href='/forgot-password'
                    className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <Input id='password' name='password' type='password' required />
                {state.fieldErrors?.password && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.password[0]}</p>
                )}
              </div>
              <Button type='submit' className='w-full' disabled={pending}>
                {pending ? t('submitting') : t('submit')}
              </Button>
            </form>
            <div className='mt-4 text-center text-sm'>
              {t('noAccount')}{' '}
              <Link
                href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup'}
                className='underline underline-offset-4'
              >
                {t('signUp')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
