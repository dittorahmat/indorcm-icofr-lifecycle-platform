/**
 * csa-worklist — derive murni "belum dinilai" untuk tab worklist CSA hub.
 *
 * Status dinilai TIDAK dibaca dari kolom controls.csa_status (stale: tidak
 * pernah ditulis alur simpan), melainkan dihitung dari keberadaan record CSA
 * non-draft: sebuah control dianggap sudah dinilai bila ada record non-draft
 * satu organisasi yang menilai sub-proses BPM-nya pada tahun tersebut, atau
 * menunjuk control itu langsung via controlId.
 */

export interface WorklistControlLike {
  id: string;
  organizationId: string;
  year: number | null;
  bpmProcessId: string | null;
}

export interface WorklistRecordLike {
  organizationId: string;
  controlId: string | null;
  bpmProcessId: string | null;
  period: string;
  isDraft: boolean | null;
}

export interface WorklistScope {
  organizationId: string;
  year: number;
}

function inScopeYear(period: string, year: number): boolean {
  return typeof period === 'string' && period.startsWith(String(year));
}

function assesses(record: WorklistRecordLike, control: WorklistControlLike, scope: WorklistScope): boolean {
  if (record.organizationId !== scope.organizationId) return false;
  if (record.isDraft === true) return false;
  if (!inScopeYear(record.period, scope.year)) return false;
  if (
    control.bpmProcessId !== null &&
    record.bpmProcessId !== null &&
    record.bpmProcessId === control.bpmProcessId
  ) {
    return true;
  }
  return record.controlId !== null && record.controlId === control.id;
}

/** Control dalam scope org+tahun yang tidak dinilai record non-draft mana pun. */
export function unassessedControlsFrom<T extends WorklistControlLike>(
  controls: T[],
  records: WorklistRecordLike[],
  scope: WorklistScope,
): T[] {
  return controls.filter(
    (control) =>
      control.organizationId === scope.organizationId &&
      control.year === scope.year &&
      !records.some((record) => assesses(record, control, scope)),
  );
}
