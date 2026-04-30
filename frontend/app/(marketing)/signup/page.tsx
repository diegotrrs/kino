'use client';
import {
  signup,
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
import Link                from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState }  from 'react';

const SignupPage = () => {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signup, {});
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '';

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className='flex flex-col gap-6'>
              {state.error && (
                <p className='text-sm text-destructive'>{state.error}</p>
              )}
              {redirect && <input type='hidden' name='redirect' value={redirect} />}
              <div className='grid gap-2'>
                <Label htmlFor='name'>Name</Label>
                <Input id='name' name='name' type='text' placeholder='John Doe' required />
                {state.fieldErrors?.name && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.name[0]}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' name='email' type='email' placeholder='m@example.com' required />
                {state.fieldErrors?.email && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.email[0]}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='password'>Password</Label>
                <Input id='password' name='password' type='password' required />
                {state.fieldErrors?.password && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.password[0]}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmPassword'>Confirm password</Label>
                <Input id='confirmPassword' name='confirmPassword' type='password' required />
                {state.fieldErrors?.confirmPassword && (
                  <p className='text-sm text-destructive'>{state.fieldErrors.confirmPassword[0]}</p>
                )}
              </div>
              <Button type='submit' className='w-full' disabled={pending}>
                {pending ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            <div className='mt-4 text-center text-sm'>
              Already have an account?{' '}
              <Link
                href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
                className='underline underline-offset-4'
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SignupPage;
