/**
 * csa-worklist-grouping — presentasi murni tab "Belum Dinilai" CSA hub.
 *
 * Mengelompokkan item worklist per sub-proses BPM (urutan kemunculan pertama)
 * dan mengklasifikasikan keadaan kosong. Judul grup yang tak tertaut memakai
 * null agar komponen memilih fallback i18n — modul ini tidak menyimpan teks UI.
 */

export interface WorklistItemLike {
  id: string;
  bpmProcessId: string | null;
  bpmProcessName: string | null;
  code: string;
  name: string;
}

export interface WorklistGroup {
  key: string;
  title: string | null;
  items: WorklistItemLike[];
}

export type WorklistEmptyKind = 'no-controls' | 'all-assessed';

const UNLINKED_KEY = 'unlinked';

export function groupWorklistByProcess(items: WorklistItemLike[]): WorklistGroup[] {
  const groups = new Map<string, WorklistGroup>();
  for (const item of items) {
    const key = item.bpmProcessId ?? UNLINKED_KEY;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, title: item.bpmProcessName, items: [item] });
    }
  }
  return Array.from(groups.values());
}

/**
 * Membedakan "tahun ini belum punya control" (no-controls) dari
 * "semua control sudah dinilai" (all-assessed) saat worklist kosong.
 */
export function classifyWorklistEmpty(hasControlsInYear: boolean): WorklistEmptyKind {
  return hasControlsInYear ? 'all-assessed' : 'no-controls';
}
