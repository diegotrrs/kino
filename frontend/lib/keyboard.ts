// Android Chrome doesn't always scroll a field that was focused from code (autoFocus) into view once the
// on-screen keyboard opens, so wait for the keyboard to shrink the visual viewport and scroll it in ourselves
export const revealWhenKeyboardOpens = (element: HTMLElement): void => {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const reveal = () => {
    viewport.removeEventListener('resize', reveal);
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  viewport.addEventListener('resize', reveal);
  // No keyboard (desktop, hardware keyboard): stop waiting
  setTimeout(() => viewport.removeEventListener('resize', reveal), 1000);
};
