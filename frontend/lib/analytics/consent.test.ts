import posthog from 'posthog-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getConsentStatus, setConsent } from './consent';

vi.mock('posthog-js', () => ({
  default: {
    get_explicit_consent_status: vi.fn(() => 'pending'),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}));

describe('analytics consent', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('when no PostHog token is configured', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
    });

    it('should report no consent status, so no banner or setting is shown', () => {
      expect(getConsentStatus()).toBeNull();
      expect(posthog.get_explicit_consent_status).not.toHaveBeenCalled();
    });

    it('should not touch PostHog, which was never started', () => {
      setConsent(true);

      expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    });
  });

  describe('when a PostHog token is configured', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
    });

    it('should report the visitor\'s explicit choice, which is pending until they answer', () => {
      expect(getConsentStatus()).toBe('pending');
    });

    it('should opt in when the visitor accepts', () => {
      setConsent(true);

      expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
      expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
    });

    it('should opt out when the visitor declines', () => {
      setConsent(false);

      expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
      expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    });
  });
});
