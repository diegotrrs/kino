'use server';
import { revalidatePath } from 'next/cache';
import { cookies }        from 'next/headers';
import { redirect }       from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const submitFeedback = async (content: string): Promise<void> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/feedback/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to submit feedback: ${text}`);
  }
}

export const toggleVote = async (wishlistId: number, userHasVoted: boolean): Promise<void> => {
  const headers = await getAuthHeaders();
  const method = userHasVoted ? 'DELETE' : 'POST';

  const res = await fetch(`${API_BASE_URL}/api/wishlist/${wishlistId}/vote`, {
    method,
    headers,
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to update vote: ${text}`);
  }

  revalidatePath('/feedback');
}
