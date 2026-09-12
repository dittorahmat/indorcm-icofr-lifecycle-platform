import { user as userTable, organization as orgTable, userPreferences as userPreferencesTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { UnifiedNotificationPayload, DispatchContext, NotificationChannelAdapter } from './types';
import { inAppAdapter } from './in-app-adapter';
import { emailAdapter } from './email-adapter';
import { slackAdapter } from './slack-adapter';
import { msTeamsAdapter } from './teams-adapter';
import { genericWebhookAdapter } from './generic-webhook-adapter';

export const notificationChannelRegistry: NotificationChannelAdapter[] = [
  inAppAdapter,
  emailAdapter,
  slackAdapter,
  msTeamsAdapter,
  genericWebhookAdapter,
];

export async function notifyMultiChannel({
  db,
  orgId,
  userId,
  message,
  title,
  type = 'info',
  link,
  metadata,
  env,
}: {
  db: any;
  orgId: string;
  userId: string;
  message: string;
  title?: string;
  type?: string;
  link?: string;
  metadata?: Record<string, any>;
  env: any;
}): Promise<{ success: boolean; dispatchedChannels: string[] }> {
  // 1. Query target user
  const users = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
  const targetUser = users.length > 0 ? users[0] : null;

  // 2. Query user notification preferences
  const prefs = await db.select().from(userPreferencesTable).where(eq(userPreferencesTable.userId, userId)).limit(1);
  const userPref = prefs.length > 0 ? (prefs[0].notificationPreferences as any) : null;

  // 3. Query organization settings
  const orgs = await db.select().from(orgTable).where(eq(orgTable.id, orgId)).limit(1);
  const settings = orgs.length > 0 ? ((orgs[0].metadata as any) || {}) : {};

  const payload: UnifiedNotificationPayload = {
    title,
    message,
    type,
    link,
    userId,
    orgId,
    metadata,
  };

  const context: DispatchContext = {
    db,
    env,
    settings,
    userPreferences: userPref,
    targetUser: targetUser ? {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
    } : null,
  };

  // 4. In-App adapter always runs synchronously to ensure database persistence
  await inAppAdapter.dispatch(payload, context);

  const dispatchedChannels: string[] = ['inApp'];

  // 5. External channels dispatch in parallel non-blockingly
  const asyncChannels = [emailAdapter, slackAdapter, msTeamsAdapter, genericWebhookAdapter];
  const dispatchPromises = asyncChannels
    .filter(adapter => adapter.isEnabled(settings, userPref))
    .map(async (adapter) => {
      dispatchedChannels.push(adapter.id);
      try {
        await Promise.race([
          adapter.dispatch(payload, context),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
        ]);
      } catch (err) {
        console.error(`Failed to dispatch notification to channel ${adapter.id}:`, err);
      }
    });

  const backgroundTask = Promise.allSettled(dispatchPromises);

  if (env.eventContext&& env.eventContext.waitUntil) {
    env.eventContext.waitUntil(backgroundTask);
  } else {
    // Do not await for Frontend REST API responsiveness
    backgroundTask.catch(() => {});
  }

  return { success: true, dispatchedChannels };
}
