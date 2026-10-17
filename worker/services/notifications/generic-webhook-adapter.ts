import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';
import { buildGenericPayload } from './payloads';

export const genericWebhookAdapter: NotificationChannelAdapter = {
  id: 'genericWebhook',
  name: 'Generic Webhook',
  isEnabled: (settings, userPref) => {
    if (!settings.genericWebhookEnabled || !settings.genericWebhookUrl) return false;
    if (userPref && userPref.genericWebhook === false) return false;
    return true;
  },
  dispatch: async (payload: UnifiedNotificationPayload, context: DispatchContext) => {
    const webhookUrl = context.settings.genericWebhookUrl;
    if (!webhookUrl) return { success: false, error: 'No generic webhook URL' };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildGenericPayload({
          appUrl: context.env.BETTER_AUTH_URL || 'http://localhost:3000',
          message: payload.message,
          title: payload.title,
          type: payload.type,
          link: payload.link,
          recipient: context.targetUser,
          metadata: payload.metadata,
        }),
      ),
    });

    if (!response.ok) {
      return { success: false, error: `Generic webhook failed with status ${response.status}` };
    }

    return { success: true };
  }
};
