import posthog from 'posthog-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identifyUser, logOutOfAnalytics, track } from './events';

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}));

describe('analytics events', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('when no PostHog token is configured', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
    });

    it('should do nothing, since PostHog was never started', () => {
      track('user_logged_in');
      identifyUser(42, 'es');
      logOutOfAnalytics();

      expect(posthog.capture).not.toHaveBeenCalled();
      expect(posthog.identify).not.toHaveBeenCalled();
      expect(posthog.reset).not.toHaveBeenCalled();
    });
  });

  describe('when a PostHog token is configured', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
    });

    it('should capture an event with its properties', () => {
      track('user_signed_up', { source: 'hot_trip' });

      expect(posthog.capture).toHaveBeenCalledWith('user_signed_up', { source: 'hot_trip' });
    });

    it('should identify a user by their id only, with their locale as the one person property', () => {
      identifyUser(42, 'es');

      expect(posthog.identify).toHaveBeenCalledWith('42', { locale: 'es' });
    });

    it('should record the log-out and then forget the user, so the next person on this device starts anonymous', () => {
      logOutOfAnalytics();

      expect(posthog.capture).toHaveBeenCalledWith('user_logged_out', undefined);
      expect(posthog.reset).toHaveBeenCalledOnce();
      expect(vi.mocked(posthog.capture).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(posthog.reset).mock.invocationCallOrder[0],
      );
    });
  });
});
