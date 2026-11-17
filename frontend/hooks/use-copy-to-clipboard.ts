'use client';
import { useEffect, useState } from 'react';

const COPIED_FOR_MS = 2000;

// Copies text and reports `isCopied` for two seconds, for a "Copied" confirmation on the button
export const useCopyToClipboard = (): { isCopied: boolean; copy: (text: string) => Promise<void> } => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timer = setTimeout(() => setIsCopied(false), COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const copy = async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
  };

  return { isCopied, copy };
};
