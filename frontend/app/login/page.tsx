'use client';

import { useActionState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link       from 'next/link';

import { login, type AuthState } from '@/app/auth/actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className='flex flex-col gap-6'>
              {state.error && (
                <p className='text-sm text-destructive'>{state.error}</p>
              )}
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' name='email' type='email' placeholder='m@example.com' required />
                {state.fieldErrors?.email && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.email[0]}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Password</Label>
                  <Link
                    href='/forgot-password'
                    className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input id='password' name='password' type='password' required />
                {state.fieldErrors?.password && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.password[0]}</p>
                )}
              </div>
              <Button type='submit' className='w-full' disabled={pending}>
                {pending ? 'Logging in...' : 'Login'}
              </Button>
            </form>
            <div className='mt-4 text-center text-sm'>
              Don&apos;t have an account?{' '}
              <Link href='/signup' className='underline underline-offset-4'>
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
