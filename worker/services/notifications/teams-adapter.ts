import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';

export const msTeamsAdapter: NotificationChannelAdapter = {
  id: 'msTeams',
  name: 'Microsoft Teams',
  isEnabled: (settings, userPref) => {
    if (!settings.msTeamsEnabled || !settings.msTeamsWebhookUrl) return false;
    if (userPref && userPref.msTeams === false) return false;
    return true;
  },
  dispatch: async (payload, context) => {
    const webhookUrl = context.settings.msTeamsWebhookUrl;
    if (!webhookUrl) return { success: false, error: 'No MS Teams webhook URL' };

    const rawType = payload.type || 'info';
    const type = typeof rawType === 'string' ? rawType.toLowerCase() : 'info';
    const themeColor = type === 'error' ? 'E11D1' : type === 'warning' ? 'FF8C00' : type === 'success' ? '10B981' : '0076D7';
    const appUrl = context.env.BETTER_AUTH_URL || 'http://localhost:3000';

    const potentialAction = payload.link ? [
      {
        '@type': 'OpenURI',
        name: 'Buka di IndoGRC Pro',
        targets: [{
          os: 'default',
          uri: `${appUrl}${payload.link}`
        }]
      }
    ] : undefined;

    const cardPayload: any = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: payload.title || 'IndoGRC Pro Alert',
      themeColor: themeColor,
      title: payload.title || `IndoGRC Pro Notification [${type.toUpperCase()}]`,
      text: payload.message,
      potentialAction
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardPayload)
    });

    if (!response.ok) {
      return { success: false, error: `MS Teams webhook failed with status ${response.status}` };
    }

    return { success: true };
  }
};
