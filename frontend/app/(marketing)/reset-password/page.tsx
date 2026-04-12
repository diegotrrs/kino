'use client';

import { resetPassword, type AuthState } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

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
              <CardTitle className='text-2xl'>Invalid link</CardTitle>
              <CardDescription>
                This password reset link is missing or malformed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/forgot-password' className='text-sm underline underline-offset-4'>
                Request a new reset link
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
            <CardTitle className='text-2xl'>Reset your password</CardTitle>
            <CardDescription>
              Enter a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className='flex flex-col gap-6'>
              {state.error && (
                <div className='space-y-1'>
                  <p className='text-sm text-destructive'>{state.error}</p>
                  <Link href='/forgot-password' className='text-xs underline underline-offset-4'>
                    Request a new reset link
                  </Link>
                </div>
              )}
              <input type='hidden' name='token' value={token} />
              <div className='grid gap-2'>
                <Label htmlFor='password'>New password</Label>
                <Input id='password' name='password' type='password' required />
                {state.fieldErrors?.password && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.password[0]}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmPassword'>Confirm new password</Label>
                <Input id='confirmPassword' name='confirmPassword' type='password' required />
                {state.fieldErrors?.confirmPassword && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.confirmPassword[0]}</p>
                )}
              </div>
              <Button type='submit' className='w-full' disabled={pending}>
                {pending ? 'Resetting...' : 'Reset password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
