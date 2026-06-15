import { config } from 'dotenv';
import path       from 'path';

config({ path: path.resolve(__dirname, '../.env.local') });

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const globalSetup = async (): Promise<void> => {
  const email = process.env.E2E_TEST_EMAIL!;
  const password = process.env.E2E_TEST_PASSWORD!;

  const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'E2E Test User', email, password }),
  });

  if (signupRes.ok) return;

  const body = (await signupRes.json().catch(() => null)) as {
    detail?: string;
  } | null;
  const detail = body?.detail ?? '';

  if (!detail.includes('already exists')) {
    throw new Error(`globalSetup: signup failed — ${detail}`);
  }

  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    throw new Error(
      `globalSetup: user "${email}" exists but the password in .env.local is wrong. ` +
        'Delete the account from the database or update E2E_TEST_PASSWORD in .env.local.'
    );
  }
};

export default globalSetup;
