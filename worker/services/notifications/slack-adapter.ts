import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';
import { buildSlackPayload } from './payloads';

export const slackAdapter: NotificationChannelAdapter = {
  id: 'slack',
  name: 'Slack',
  isEnabled: (settings, userPref) => {
    if (!settings.slackEnabled || !settings.slackWebhookUrl) return false;
    if (userPref && userPref.slack === false) return false;
    return true;
  },
  dispatch: async (payload: UnifiedNotificationPayload, context: DispatchContext) => {
    const webhookUrl = context.settings.slackWebhookUrl;
    if (!webhookUrl) return { success: false, error: 'No slack webhook URL' };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildSlackPayload({
          appUrl: context.env.BETTER_AUTH_URL || 'http://localhost:3000',
          message: payload.message,
          title: payload.title,
          type: payload.type,
          link: payload.link,
        }),
      ),
    });

    if (!response.ok) {
      return { success: false, error: 'Slack webhook failed' };
    }

    return { success: true };
  }
};
