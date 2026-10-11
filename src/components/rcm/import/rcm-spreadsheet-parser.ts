import type { RCMFlavor, RCMImportParsedRow } from './rcm-import-types';

export function parseRCMSpreadsheet(
  text: string,
  flavor: RCMFlavor
): { rows: RCMImportParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) {
    return { rows: [], errors: ['File is empty or contains only headers'] };
  }

  // Detect delimiter: semicolon or comma
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());

  const getCol = (cells: string[], names: string[]): string => {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name.toLowerCase()));
      if (idx !== -1 && cells[idx] !== undefined) {
        return cells[idx].trim();
      }
    }
    return '';
  };

  const parsedRows: RCMImportParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCells = lines[i].split(delimiter);
    if (rawCells.length < 3) continue;

    const rowId = `row-${i}`;
    let processName = getCol(rawCells, ['proses_bisnis', 'proses', 'process']);
    let subProcessName = getCol(rawCells, ['sub_proses', 'sub_process', 'subprocess']);
    const bpmNodeRef = getCol(rawCells, ['ref_langkah_bpm', 'langkah_alur', 'noderef', 'step']);
    const riskDesc = getCol(rawCells, ['risiko', 'risk_description', 'deskripsi_risiko']);
    const controlName = getCol(rawCells, ['nama_aktivitas_pengendalian', 'nama_pengendalian', 'control_name', 'aktivitas_pengendalian']);
    const controlCode = getCol(rawCells, ['referensi_pengendalian', 'kode_pengendalian', 'control_code', 'kode_kontrol']);
    const controlDesc = getCol(rawCells, ['deskripsi_aktivitas_pengendalian', 'deskripsi_pengendalian', 'control_description']);

    if (!processName) processName = 'General Process';
    if (!subProcessName) subProcessName = processName;

    const rowErrors: string[] = [];
    if (!riskDesc && flavor !== 'ELC') {
      rowErrors.push('Deskripsi risiko wajib diisi');
    }
    if (!controlName) {
      rowErrors.push('Nama aktivitas pengendalian wajib diisi');
    }

    const row: RCMImportParsedRow = {
      id: rowId,
      processName,
      subProcessName,
      bpmNodeRef: bpmNodeRef || undefined,
      riskDescription: riskDesc || `Pengendalian ${controlName}`,
      isFraudRelated: ['ya', 'y', 'true', '1'].includes(getCol(rawCells, ['fraud']).toLowerCase()),
      riskRating: getCol(rawCells, ['penilaian_risiko', 'risk_rating']) || 'Medium',
      controlCode: controlCode || undefined,
      controlName: controlName || `Kontrol #${i}`,
      controlDescription: controlDesc || undefined,
      supportingDocs: getCol(rawCells, ['dokumen_pendukung', 'supporting_docs']) || undefined,
      isKeyControl: ['ya', 'y', 'true', '1'].includes(getCol(rawCells, ['pengendalian_utama', 'key_control']).toLowerCase()),
      controlType: getCol(rawCells, ['tipe_pengendalian', 'preventif_detektif', 'type']) || 'Preventif',
      controlNature: getCol(rawCells, ['sifat_pengendalian', 'nature']) || 'Manual',
      frequency: getCol(rawCells, ['frekuensi', 'frequency']) || 'Bulanan',
      supportingApp: getCol(rawCells, ['aplikasi_pendukung', 'aplikasi_it', 'application']) || undefined,
      executorRole: getCol(rawCells, ['pelaku_pengendalian', 'pelaksana', 'role']) || undefined,
      affectedFsliItem: getCol(rawCells, ['fsli', 'akun_signifikan', 'laporan_keuangan']) || undefined,
      effectivePeriod: getCol(rawCells, ['periode_efektif', 'periode']) || undefined,
      ipoC: getCol(rawCells, ['ipo_c']) || 'N',
      ipoA: getCol(rawCells, ['ipo_a']) || 'N',
      ipoV: getCol(rawCells, ['ipo_v']) || 'N',
      ipoRa: getCol(rawCells, ['ipo_ra']) || 'N',
      assertionC: getCol(rawCells, ['asersi_c']) || 'N',
      assertionE: getCol(rawCells, ['asersi_e', 'asersi_e_o']) || 'N',
      assertionA: getCol(rawCells, ['asersi_a']) || 'N',
      assertionCo: getCol(rawCells, ['asersi_co']) || 'N',
      assertionVa: getCol(rawCells, ['asersi_va', 'asersi_v_a']) || 'N',
      assertionRo: getCol(rawCells, ['asersi_ro', 'asersi_r_o']) || 'N',
      assertionPd: getCol(rawCells, ['asersi_pd']) || 'N',
      itgcDomain: flavor === 'ITGC' ? getCol(rawCells, ['domain_itgc', 'domain']) : undefined,
      isValid: rowErrors.length === 0,
      validationErrors: rowErrors,
    };

    if (flavor === 'ELC') {
      const cosoRaw = getCol(rawCells, ['prinsip_coso', 'coso']);
      const parsedNum = parseInt(cosoRaw, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 17) {
        row.cosoPrinciples = [parsedNum];
      }
    }

    parsedRows.push(row);
  }

  return { rows: parsedRows, errors };
}
