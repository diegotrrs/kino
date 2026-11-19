'use client';
import { submitFeedback } from '@/app/(app)/feedback/actions';
import { Button }         from '@/components/ui/button';
import { Textarea }       from '@/components/ui/textarea';
import { useToast }       from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  useState,
  useTransition
}                         from 'react';

const MAX_LENGTH = 500;

export const FeedbackForm = () => {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const t = useTranslations('feedback');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await submitFeedback(content.trim());
        setContent('');
        toast({ title: t('sent') });
      } catch {
        toast({ variant: 'destructive', title: t('sendFailed') });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3'>
      <Textarea
        placeholder={t('placeholder')}
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
          {isPending ? t('sending') : t('send')}
        </Button>
      </div>
    </form>
  );
}
