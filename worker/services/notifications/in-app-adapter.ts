import { notifications } from '../../db/schema';
import type { NotificationChannelAdapter, UnifiedNotificationPayload, DispatchContext } from './types';

export const inAppAdapter: NotificationChannelAdapter = {
  id: 'inApp',
  name: 'In-App',
  isEnabled: (_settings, userPref) => {
    if (userPref && userPref.inApp === false) return false;
    return true;
  },
  dispatch: async (payload, context) => {
    const id = crypto.randomUUID();
    await context.db.insert(notifications).values({
      id,
      organizationId: payload.orgId,
      userId: payload.userId,
      message: payload.message,
      type: (payload.type || 'info') as any,
      link: payload.link,
      readStatus: false,
      createdAt: new Date(),
    });
    return { success: true };
  },
};
