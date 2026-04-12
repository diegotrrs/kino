'use client';

import { submitFeedback } from '@/app/(app)/feedback/actions';
import { Button }   from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';

const MAX_LENGTH = 500;

export function FeedbackForm() {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await submitFeedback(content.trim());
        setContent('');
        toast({ title: 'Feedback sent. Thank you!' });
      } catch {
        toast({ variant: 'destructive', title: 'Failed to send feedback. Please try again.' });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <Textarea
        placeholder='Share your thoughts, ideas, or report an issue...'
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        disabled={isPending}
      />
      <div className='flex items-center justify-between'>
        <span className='text-xs text-muted-foreground'>
          {content.length} / {MAX_LENGTH}
        </span>
        <Button type='submit' size='sm' disabled={isPending || !content.trim()}>
          {isPending ? 'Sending...' : 'Send feedback'}
        </Button>
      </div>
    </form>
  );
}
