import { describe, it, expect, vi } from 'vitest';
import { slackAdapter } from '../../worker/services/notifications/slack-adapter';
import { msTeamsAdapter } from '../../worker/services/notifications/teams-adapter';
import { genericWebhookAdapter } from '../../worker/services/notifications/generic-webhook-adapter';


describe('Notification Channel Adapters', () => {
  describe('isEnabled recipient preferences', () => {
    it('should respect user disabling slack', () => {
      const settings = { slackEnabled: true, slackWebhookUrl: 'https://hooks.slack.com/xs'};
      expect(slackAdapter.isEnabled(settings, { inApp: true, email: true, slack: false, msTeams: true, genericWebhook: true })).toBe(false);
      expect(slackAdapter.isEnabled(settings, { inApp: true, email: true, slack: true, msTeams: true, genericWebhook: true })).toBe(true);
    });

    it('should respect organization webhook disabled state', () => {
      const settings = { msTeamsEnabled: false, msTeamsWebhookUrl: 'https://outlook.office.com/xx' };
      expect(msTeamsAdapter.isEnabled(settings, null)).toBe(false);
    });

    it('generic webhook should be enabled only when URL and flag are set', () => {
      expect(genericWebhookAdapter.isEnabled({}, null)).toBe(false);
      expect(genericWebhookAdapter.isEnabled({
        genericWebhookEnabled: true,
        genericWebhookUrl: 'https://example.com/webhook'
      }, null)).toBe(true);
    });
  });

  describe('payload dispatching', () => {
    it('should dispatch to generic webhook with right JSON format', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200
      } as any);

      const result = await genericWebhookAdapter.dispatch(
        {
          title: 'CSA Task Assigned',
          message: 'Harap verifikasi CSA R3',
          type: 'warning',
          link: '/csa',
          userId: 'user-123',
          orgId: 'org-456'
        },
        {
          db: {},
          env: { BETTER_AUTH_URL: 'https://indogrc.com' },
          settings: { genericWebhookUrl: 'https://api.my-bumn.co.id/alerts' },
          targetUser: { id: 'user-123', name: 'Ahmad', email: 'ahmad@company.com' },
        }
      );

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.my-bumn.co.id/alerts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      fetchSpy.mockRestore();
    });
  });
});
