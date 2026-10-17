import type { Settings } from '@shared/types';

/**
 * Webhook provider union: the value sent to `POST /api/settings/test-webhook` and
 * the discriminator of one row in `WEBHOOK_FIELDS`. Adding a fourth provider is
 * one config entry — the rows are `.map`ped, never hand-written three times
 * (AGENTS.md: JSX duplicated >=3x must be config-driven).
 */
export type WebhookProvider = 'slack' | 'msTeams' | 'generic';

/** Boolean-valued `Settings` keys (enable toggles), derived so they cannot drift. */
type SettingsBooleanKey = {
  [K in keyof Settings]-?: NonNullable<Settings[K]> extends boolean ? K : never;
}[keyof Settings];

/** String-valued `Settings` keys (webhook URLs), derived so they cannot drift. */
type SettingsStringKey = {
  [K in keyof Settings]-?: NonNullable<Settings[K]> extends string ? K : never;
}[keyof Settings];

/**
 * Data-carried i18n keys ride on a literal union (CODING_STANDARDS.md): a typo is
 * a `tsc` error, and `settings-webhooks.test.tsx` calls `validateI18nKey` on every
 * one WITHOUT a `defaultValue` so a missing namespace cannot stay invisible.
 */
export type WebhookLabelKey =
  | 'webhookSettings.slackTitle'
  | 'webhookSettings.slackDesc'
  | 'webhookSettings.slackPlaceholder'
  | 'webhookSettings.teamsTitle'
  | 'webhookSettings.teamsDesc'
  | 'webhookSettings.teamsPlaceholder'
  | 'webhookSettings.genericTitle'
  | 'webhookSettings.genericDesc'
  | 'webhookSettings.genericPlaceholder';

export interface WebhookField {
  provider: WebhookProvider;
  enabledKey: SettingsBooleanKey;
  urlKey: SettingsStringKey;
  titleKey: WebhookLabelKey;
  descKey: WebhookLabelKey;
  placeholderKey: WebhookLabelKey;
}

export const WEBHOOK_FIELDS: readonly WebhookField[] = [
  {
    provider: 'slack',
    enabledKey: 'slackEnabled',
    urlKey: 'slackWebhookUrl',
    titleKey: 'webhookSettings.slackTitle',
    descKey: 'webhookSettings.slackDesc',
    placeholderKey: 'webhookSettings.slackPlaceholder',
  },
  {
    provider: 'msTeams',
    enabledKey: 'msTeamsEnabled',
    urlKey: 'msTeamsWebhookUrl',
    titleKey: 'webhookSettings.teamsTitle',
    descKey: 'webhookSettings.teamsDesc',
    placeholderKey: 'webhookSettings.teamsPlaceholder',
  },
  {
    provider: 'generic',
    enabledKey: 'genericWebhookEnabled',
    urlKey: 'genericWebhookUrl',
    titleKey: 'webhookSettings.genericTitle',
    descKey: 'webhookSettings.genericDesc',
    placeholderKey: 'webhookSettings.genericPlaceholder',
  },
];
