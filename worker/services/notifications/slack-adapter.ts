import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';

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

    const type = (payload.type || 'info').toUpperCase();
    const appUrl = context.env.BETTER_AUTH_URL || 'http://localhost:3000';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: payload.title || ('IndoGRC Pro - ' + type)
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Severity:* ${type}\n${payload.message}`
        }
      }
    ];

    if (payload.link) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Buka di IndoGRC Pro'
            },
            url: `${appUrl}${payload.link}`
          }
        ]
      });
    }


    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[${payload.type || 'info'}] ${payload.message}`,
        blocks
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Slack webhook failed' };
    }

    return { success: true };
  }
};
