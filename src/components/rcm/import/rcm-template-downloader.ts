import type { RCMFlavor } from './rcm-import-types';
import { buildRcmTemplateCsv, getRcmTemplateFilename } from './rcm-ingestion';

/** Template table lives on the ingestion seam; re-exported here for callers. */
export { RCM_TEMPLATES } from './rcm-ingestion';

/**
 * Thin DOM adapter over the seam-owned template contract: builds the CSV
 * text via rcm-ingestion and triggers the browser download.
 */
export function downloadRCMTemplate(flavor: RCMFlavor): void {
  const csvContent = buildRcmTemplateCsv(flavor);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.setAttribute('hidden', '');
  anchor.setAttribute('href', url);
  anchor.setAttribute('download', getRcmTemplateFilename(flavor));
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
