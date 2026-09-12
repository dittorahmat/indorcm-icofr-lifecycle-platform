import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';

export const genericWebhookAdapter: NotificationChannelAdapter = {
  id: 'genericWebhook',
  name: 'Generic Webhook',
  isEnabled: (settings, userPref) => {
    if (!settings.genericWebhookEnabled || !settings.genericWebhookUrl) return false;
    if (userPref && userPref.genericWebhook === false) return false;
    return true;
  },
  dispatch: async (payload, context) => {
    const webhookUrl = context.settings.genericWebhookUrl;
    if (!webhookUrl) return { success: false, error: 'No generic webhook URL' };

    const appUrl = context.env.BETTER_AUTH_URL || 'http://localhost:3000';

    const body = {
      event: 'icofr.notification',
      timestamp: new Date().toISOString(),
      type: payload.type || 'info',
      title: payload.title || 'IndoGRC Pro Notification',
      message: payload.message,
      link: payload.link ? `${appUrl}${payload.link}` : undefined,
      recipient: context.targetUser ? {
        id: context.targetUser.id,
        name: context.targetUser.name,
        email: context.targetUser.email,
      } : undefined,
      metadata: payload.metadata,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return { success: false, error: `Generic webhook failed with status ${response.status}` };
    }

    return { success: true };
  }
};
