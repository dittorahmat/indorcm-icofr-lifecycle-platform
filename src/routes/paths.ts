/**
 * Centralized Application Route Definitions
 * Source of truth for client-side navigation paths.
 */
export const ROUTES = {
  HOME: '/',
  ACTIVATE: '/activate',
  WELCOME: '/welcome',
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  SCOPING: '/scoping',
  SCOPING_APPROVAL: '/scoping/approval',
  RCM: '/rcm',
  RCM_LEGACY_BPM: '/rcm/bpm',
  RCM_TLC: '/rcm/tlc',
  RCM_ELC: '/rcm/elc',
  RCM_ITGC: '/rcm/itgc',
  RCM_VERIFICATION_DESIGN: '/rcm/verification-design',
  CHANGE_LOG: '/change-log',
  SOC_MONITORING: '/soc-monitoring',
  APPLICATIONS: '/applications',
  BPM: '/bpm',
  TODO: '/todo',
  CSA: '/csa',
  TESTING: '/testing',
  DEFICIENCIES: '/deficiencies',
  REPORTS: '/reports',
  REPORTS_APPENDIX_10: '/reports/appendix-10',
  AI_HUB: '/ai-hub',
  WBS_RECAP: '/wbs-recap',
  AUDIT_PORTAL: '/audit-portal',
  IMPORT: '/import',
  SETTINGS: '/settings',
  ADMIN_USERS: '/admin/users',
  DOCUMENTS: '/documents',
  NOTIFICATIONS: '/notifications',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
