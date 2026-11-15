/**
 * Standardized column widths for RCM (Risk and Control Matrix) tables.
 * Ensures consistent narrative density across TLC, ITGC, ELC, and Verification tables.
 */
export const RCM_NARRATIVE_WIDTHS = {
  processInfo: '280px',
  subProcess: '250px',
  riskDesc: '520px',
  controlName: '380px',
  controlDesc: '580px',
  supportingDocs: '250px',
  elcName: '360px',
  elcDescription: '560px',
  elcSupportingDocs: '220px',
  verificationControlName: '360px',
  verificationControlDesc: '560px',
} as const;
