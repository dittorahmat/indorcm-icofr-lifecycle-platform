import type { UserNotificationPreferences } from '../../../shared/types';

export interface UnifiedNotificationPayload {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  link?: string;
  userId: string;
  orgId: string;
  metadata?: Record<string, any>;
}

export interface DispatchContext {
  db: any;
  env: any;
  settings: Record<string, any>;
  userPreferences?: UserNotificationPreferences | null;
  targetUser?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

export interface NotificationChannelAdapter {
  id: string;
  name: string;
  isEnabled: (settings: Record<string, any>, userPref?: UserNotificationPreferences | null) => boolean;
  dispatch: (payload: UnifiedNotificationPayload, context: DispatchContext) => Promise<{ success: boolean; error?: string }>;
}
