'use server';
import { cookies }  from 'next/headers';
import { redirect } from 'next/navigation';
import { z }        from 'zod';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
};

const safeRedirectPath = (raw: FormDataEntryValue | null): string => {
  if (typeof raw !== 'string') return '/home';
  const decoded = decodeURIComponent(raw);
  // Only allow relative paths starting with /
  return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : '/home';
}

export const login = async (_prev: AuthState, formData: FormData): Promise<AuthState> => {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { error: body?.detail ?? 'Invalid email or password' };
  }

  const { access_token } = await res.json();
  const cookieStore = await cookies();
  cookieStore.set('token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  redirect(safeRedirectPath(formData.get('redirect')));
}

export const signup = async (_prev: AuthState, formData: FormData): Promise<AuthState> => {
  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { confirmPassword: _confirmPassword, ...body } = parsed.data;

  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { error: data?.detail ?? 'Failed to create account' };
  }

  const { access_token } = await res.json();
  const cookieStore = await cookies();
  cookieStore.set('token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  redirect(safeRedirectPath(formData.get('redirect')));
}

export const logout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}

export const requestPasswordReset = async (
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> => {
  const email = formData.get('email');
  if (typeof email !== 'string' || !email) {
    return { fieldErrors: { email: ['Email is required'] } };
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    return { error: 'Something went wrong. Please try again.' };
  }

  const { message } = await res.json();
  return { success: message };
}

export const resetPassword = async (
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> => {
  const token = formData.get('token');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (typeof password !== 'string' || password.length < 8) {
    return { fieldErrors: { password: ['Password must be at least 8 characters'] } };
  }
  if (password !== confirmPassword) {
    return { fieldErrors: { confirmPassword: ['Passwords do not match'] } };
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { error: body?.detail ?? 'Invalid or expired link. Please request a new one.' };
  }

  redirect('/login');
}
