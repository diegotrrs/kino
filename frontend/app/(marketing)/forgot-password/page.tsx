'use client';
import {
  requestPasswordReset,
  type AuthState
}                         from '@/app/auth/actions';
import { Button }         from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
}                         from '@/components/ui/card';
import { Input }          from '@/components/ui/input';
import { Label }          from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import Link               from 'next/link';
import { useActionState } from 'react';

const ForgotPasswordPage = () => {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {}
  );
  const t = useTranslations('auth.forgotPassword');

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
            {state.success ? (
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>{state.success}</p>
                <Link href='/login' className='text-sm underline underline-offset-4'>
                  {t('backToLogin')}
                </Link>
              </div>
            ) : (
              <form action={formAction} className='flex flex-col gap-6'>
                {state.error && (
                  <p className='text-sm text-destructive'>{state.error}</p>
                )}
                <div className='grid gap-2'>
                  <Label htmlFor='email'>{t('email')}</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                  {state.fieldErrors?.email && (
                    <p className='text-sm text-destructive'>{state.fieldErrors.email[0]}</p>
                  )}
                </div>
                <Button type='submit' className='w-full' disabled={pending}>
                  {pending ? t('submitting') : t('submit')}
                </Button>
                <div className='text-center text-sm'>
                  <Link href='/login' className='underline underline-offset-4'>
                    {t('backToLogin')}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
