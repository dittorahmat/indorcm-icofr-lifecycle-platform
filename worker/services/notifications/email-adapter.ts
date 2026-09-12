import { sendEmail } from '../email';
import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';

export const emailAdapter: NotificationChannelAdapter = {
  id: 'email',
  name: 'Email',
  isEnabled: (_settings, userPref) => {
    if (userPref && userPref.email === false) return false;
    return true;
  },
  dispatch: async (payload: UnifiedNotificationPayload, context: DispatchContext) => {
    const targetEmail = context.targetUser&& context.targetUser.email;
    if (!targetEmail) return { success: false, error: 'No target email' };

    const type = payload.type || 'info';
    const subject = payload.title || `IndoGRC Pro - ${type.toUpperCase()}: ${payload.message.length > 50 ? payload.message.substring(0, 50) + '...' : payload.message}`;
    const appUrl = context.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const ctaLink = payload.link ? `<div style="margin: 24px 0;"><a href="${appUrl}${payload.link}" style="display: inline-block; padding: 10px 20px; color: #ffffff; background-color: #10b981; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Buka di IndoGRC Pro</a></div>` : '';

    const html = `
      <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: bold; border-radius: 20px; background-color: #e0f2fe; color: #0369a1; text-transform: uppercase;">
            ${type}
          </span>
        </div>
        <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">${payload.message}</p>
        ${ctaLink}
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">Email ini dikirim secara otomatis oleh system IndoGRC Pro.</p>
      </div>
    `;

    return await sendEmail({
      to: targetEmail,
      subject,
      html,
      settings: context.settings,
      env: context.env,
    });
  },
};
