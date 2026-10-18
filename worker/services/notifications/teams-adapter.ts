import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';
import { buildTeamsPayload } from './payloads';

export const msTeamsAdapter: NotificationChannelAdapter = {
  id: 'msTeams',
  name: 'Microsoft Teams',
  isEnabled: (settings, userPref) => {
    if (!settings.msTeamsEnabled || !settings.msTeamsWebhookUrl) return false;
    if (userPref && userPref.msTeams === false) return false;
    return true;
  },
  dispatch: async (payload: UnifiedNotificationPayload, context: DispatchContext) => {
    const webhookUrl = context.settings.msTeamsWebhookUrl;
    if (!webhookUrl) return { success: false, error: 'No MS Teams webhook URL' };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildTeamsPayload({
          appUrl: context.env.BETTER_AUTH_URL || 'http://localhost:3000',
          message: payload.message,
          title: payload.title,
          type: payload.type,
          link: payload.link,
        }),
      ),
    });

    if (!response.ok) {
      return { success: false, error: `MS Teams webhook failed with status ${response.status}` };
    }

    return { success: true };
  }
};
