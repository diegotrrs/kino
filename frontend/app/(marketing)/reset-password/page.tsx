'use client';
import {
  resetPassword,
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

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const t = useTranslations('auth.resetPassword');

  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPassword,
    {}
  );

  if (!token) {
    return (
      <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
        <div className='w-full max-w-sm'>
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>{t('invalidTitle')}</CardTitle>
              <CardDescription>
                {t('invalidDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/forgot-password' className='text-sm underline underline-offset-4'>
                {t('requestNew')}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                <div className='space-y-1'>
                  <p className='text-sm text-destructive'>{state.error}</p>
                  <Link href='/forgot-password' className='text-xs underline underline-offset-4'>
                    {t('requestNew')}
                  </Link>
                </div>
              )}
              <input type='hidden' name='token' value={token} />
              <div className='grid gap-2'>
                <Label htmlFor='password'>{t('newPassword')}</Label>
                <Input id='password' name='password' type='password' required />
                {state.fieldErrors?.password && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.password[0]}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmPassword'>{t('confirmPassword')}</Label>
                <Input id='confirmPassword' name='confirmPassword' type='password' required />
                {state.fieldErrors?.confirmPassword && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.confirmPassword[0]}</p>
                )}
              </div>
              <Button type='submit' className='w-full' disabled={pending}>
                {pending ? t('submitting') : t('submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
