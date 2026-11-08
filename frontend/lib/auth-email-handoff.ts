// Carries the email typed on /login over to /forgot-password without putting it in the URL
// (URLs end up in browser history and server logs). Storage can be unavailable, e.g. private mode.
const STORAGE_KEY = 'kino:auth-email';

export const saveAuthEmail = (email: string): void => {
  try {
    if (email) {
      sessionStorage.setItem(STORAGE_KEY, email);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage blocked: the forgot-password field simply starts empty
  }
};

export const readAuthEmail = (): string => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};
