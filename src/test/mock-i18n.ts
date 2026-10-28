import commonEn from '../i18n/locales/en/common.json';
import sidebarEn from '../i18n/locales/en/sidebar.json';
import scopingEn from '../i18n/locales/en/scoping.json';
import dashboardEn from '../i18n/locales/en/dashboard.json';
import reportsEn from '../i18n/locales/en/reports.json';
import knowledgeEn from '../i18n/locales/en/knowledge.json';
import bpmEn from '../i18n/locales/en/bpm.json';
import deficiencyEn from '../i18n/locales/en/deficiency.json';
import testingEn from '../i18n/locales/en/testing.json';
import riskLibraryEn from '../i18n/locales/en/risklibrary.json';
import rcmEn from '../i18n/locales/en/rcm.json';
import csaHubEn from '../i18n/locales/en/csa_hub.json';
import aiEn from '../i18n/locales/en/ai.json';
import workflowEn from '../i18n/locales/en/workflow.json';
import authEn from '../i18n/locales/en/auth.json';
import adminEn from '../i18n/locales/en/admin.json';
import analyticsEn from '../i18n/locales/en/analytics.json';

/**
 * Strict i18n mock for tests (test-only, never product code).
 *
 * Split of duties with the CI gate (`scripts/check-i18n.mjs`):
 * - This helper checks EXISTENCE in any en namespace and throws on a miss.
 *   A missing key renders as a raw key in prod (CSA worklist incident:
 *   `t('worklist.cta')` vs `page.worklist.cta`), so the test must go red.
 * - Namespace-correctness (`page.worklist.*` under `csa_hub`, not bare) is
 *   enforced by the CI gate, which sees each file's `useTranslation` scopes.
 *
 * Semantics mirror the old identity mocks: found keys return the key itself
 * (existing `getByText('some.key')` assertions keep passing), and an explicit
 * `defaultValue` option wins without throwing (prod renders the fallback,
 * not a raw key). Dynamic keys are skipped by design.
 */
export const BUNDLES: Record<string, unknown> = {
  common: commonEn,
  sidebar: sidebarEn,
  scoping: scopingEn,
  dashboard: dashboardEn,
  reports: reportsEn,
  knowledge: knowledgeEn,
  bpm: bpmEn,
  deficiency: deficiencyEn,
  testing: testingEn,
  risklibrary: riskLibraryEn,
  rcm: rcmEn,
  csa_hub: csaHubEn,
  ai: aiEn,
  workflow: workflowEn,
  auth: authEn,
  admin: adminEn,
  analytics: analyticsEn,
};

const STATIC_KEY_PATTERN = /^[A-Za-z0-9_:.~-]+$/;

export function lookupEnKey(ns: string, path: string): string | undefined {
  const bundle = BUNDLES[ns];
  if (bundle === undefined) return undefined;
  return lookupPath(bundle, path);
}

function lookupPath(bundle: unknown, path: string): string | undefined {
  let node: unknown = bundle;
  for (const seg of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    const hit: [string, unknown] | undefined = Object.entries(node).find(([k]) => k === seg);
    if (!hit) return undefined;
    node = hit[1];
  }
  return typeof node === 'string' ? node : undefined;
}

function missingKey(raw: string): string | null {
  if (!raw || !STATIC_KEY_PATTERN.test(raw)) return null;
  if (raw.includes(':')) {
    const idx = raw.indexOf(':');
    const ns = raw.slice(0, idx);
    const path = raw.slice(idx + 1);
    return lookupEnKey(ns, path) === undefined ? raw : null;
  }
  for (const ns of Object.keys(BUNDLES)) {
    if (lookupEnKey(ns, raw) !== undefined) return null;
  }
  return `*:${raw}`;
}

export function validateI18nKey(key: string): void {
  const miss = missingKey(key);
  if (miss) {
    throw new Error(`[i18n-test] missing en locale key: ${miss} (renders raw in prod)`);
  }
}

export function strictT(key: string, opts?: { defaultValue?: string } | string): string {
  if (typeof opts === 'string') return opts;
  if (typeof opts?.defaultValue === 'string') return opts.defaultValue;
  validateI18nKey(key);
  return key;
}
