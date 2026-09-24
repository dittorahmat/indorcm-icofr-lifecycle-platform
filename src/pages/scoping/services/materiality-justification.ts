import type {
  EntityCharacteristics,
  InternalControlMaturity,
  AuditAdjustmentHistory,
  SystemStability,
  MaterialityJustification
} from '@shared/types';

interface NarrativeParams {
  basis?: string | null;
  omPercentage?: number | null;
  haircutPercentage?: number | null;
  pmPercentage?: number | null;
  entityCharacteristics?: EntityCharacteristics | null;
  internalControlMaturity?: InternalControlMaturity | null;
  auditAdjustmentHistory?: AuditAdjustmentHistory | null;
  systemStability?: SystemStability | null;
  language?: 'id' | 'en';
}

export function generateMaterialityNarrative({
  basis = 'Laba Sebelum Pajak (PBT)',
  omPercentage = 5,
  haircutPercentage = 25,
  entityCharacteristics,
  internalControlMaturity,
  auditAdjustmentHistory,
  systemStability,
  language = 'id'
}: NarrativeParams): string {
  const pmPct = 100 - (haircutPercentage ?? 25);
  const isEn = language === 'en';

  if (!entityCharacteristics && !internalControlMaturity && !auditAdjustmentHistory && !systemStability) {
    return isEn 
      ? `Materiality parameters set to ${omPercentage}% OM and ${haircutPercentage}% Haircut (PM ${pmPct}% of OM) based on ${basis}. Detailed justification is pending.`
      : `Parameter materialitas ditetapkan pada ${omPercentage}% OM dan Haircut ${haircutPercentage}% (PM ${pmPct}% dari OM) berdasarkan basis ${basis}. Justifikasi rinci belum dilengkapi.`;
  }

  if (isEn) {
    // English synthesis
    let entityText = `Selected ${basis || 'PBT'} as the benchmark`;
    if (entityCharacteristics === 'profit_oriented') {
      entityText = `Management established ${basis || 'PBT'} as the benchmark reflecting stakeholder focus on operational profitability and earnings quality`;
    } else if (entityCharacteristics === 'asset_intensive') {
      entityText = `Management established ${basis || 'Total Assets'} as the benchmark considering the capital-intensive nature and stewardship of fixed assets`;
    } else if (entityCharacteristics === 'revenue_driven') {
      entityText = `Management established ${basis || 'Total Revenue'} as the benchmark given thin margins and high transaction volume`;
    } else if (entityCharacteristics === 'volatile_breakeven') {
      entityText = `Management established ${basis || 'Total Assets/Revenue'} as the benchmark due to significant historical earnings volatility and near break-even results`;
    }

    let controlText = '';
    if (internalControlMaturity === 'effective_strong') {
      controlText = 'a strong and mature internal control environment without material weaknesses';
    } else if (internalControlMaturity === 'moderate') {
      controlText = 'a moderate control environment where identified deficiencies are actively under remediation';
    } else if (internalControlMaturity === 'deficient_material_weakness') {
      controlText = 'elevated control risk driven by unresolved significant deficiencies or material weaknesses';
    }

    let auditText = '';
    if (auditAdjustmentHistory === 'low_clean') {
      auditText = 'minimal or no historical audit adjustments by external auditors';
    } else if (auditAdjustmentHistory === 'moderate') {
      auditText = 'moderate historical audit adjustments';
    } else if (auditAdjustmentHistory === 'significant') {
      auditText = 'a history of significant prior-period audit adjustments';
    }

    let sysText = '';
    if (systemStability === 'stable') {
      sysText = 'stable core accounting and ERP systems';
    } else if (systemStability === 'major_change_erp_restructure') {
      sysText = 'heightened residual risk from major ERP rollout, system transformation, or restructuring';
    }

    const pmRationale = [controlText, auditText, sysText].filter(Boolean).join(', ');

    return `${entityText}. Overall Materiality (OM) is calibrated at ${omPercentage}%. Performance Materiality (PM) haircut is established at ${haircutPercentage}% (PM ${pmPct}% of OM), justified by ${pmRationale || 'evaluated entity risk profile'}.`;
  }

  // Indonesian synthesis
  let entityText = `Manajemen menetapkan ${basis || 'Laba Sebelum Pajak'} sebagai basis benchmark`;
  if (entityCharacteristics === 'profit_oriented') {
    entityText = `Manajemen menetapkan ${basis || 'Laba Sebelum Pajak'} sebagai basis benchmark dengan pertimbangan fokus pemangku kepentingan pada profitabilitas dan kinerja laba entitas`;
  } else if (entityCharacteristics === 'asset_intensive') {
    entityText = `Manajemen menetapkan ${basis || 'Total Aset'} sebagai basis benchmark mengingat karakteristik usaha yang intensif aset/kapital`;
  } else if (entityCharacteristics === 'revenue_driven') {
    entityText = `Manajemen menetapkan ${basis || 'Pendapatan/Omzet'} sebagai basis benchmark dengan pertimbangan margin usaha yang tipis dan volume transaksi yang tinggi`;
  } else if (entityCharacteristics === 'volatile_breakeven') {
    entityText = `Manajemen menetapkan ${basis || 'Aset/Pendapatan'} sebagai basis benchmark akibat volatilitas laba yang tinggi atau kondisi mendekati impas`;
  }

  let controlText = '';
  if (internalControlMaturity === 'effective_strong') {
    controlText = 'lingkungan pengendalian internal yang dinilai efektif tanpa defisiensi material';
  } else if (internalControlMaturity === 'moderate') {
    controlText = 'lingkungan pengendalian internal yang moderat dengan defisiensi dalam proses perbaikan';
  } else if (internalControlMaturity === 'deficient_material_weakness') {
    controlText = 'risiko pengendalian yang meningkat akibat adanya defisiensi signifikan atau kelemahan material';
  }

  let auditText = '';
  if (auditAdjustmentHistory === 'low_clean') {
    auditText = 'riwayat salah saji/koreksi audit tahun lalu yang rendah atau nihil';
  } else if (auditAdjustmentHistory === 'moderate') {
    auditText = 'adanya beberapa penyesuaian audit historis dari auditor eksternal';
  } else if (auditAdjustmentHistory === 'significant') {
    auditText = 'riwayat koreksi audit yang signifikan pada periode sebelumnya';
  }

  let sysText = '';
  if (systemStability === 'stable') {
    sysText = 'stabilitas proses bisnis dan sistem TI akuntansi tanpa perubahan mayor';
  } else if (systemStability === 'major_change_erp_restructure') {
    sysText = 'risiko residual dari migrasi sistem ERP baru atau restrukturisasi organisasi';
  }

  const pmRationale = [controlText, auditText, sysText].filter(Boolean).join(', ');

  return `${entityText}. Materialitas Keseluruhan (OM) ditetapkan sebesar ${omPercentage}%. Haircut Materialitas Pelaksanaan (PM) ditetapkan sebesar ${haircutPercentage}% (PM ${pmPct}% dari OM), didasarkan pada pertimbangan ${pmRationale || 'profil risiko entitas'}.`;
}

export function isJustificationComplete(justification?: MaterialityJustification | null): boolean {
  if (!justification) return false;
  return Boolean(
    justification.entityCharacteristics &&
    justification.internalControlMaturity &&
    justification.auditAdjustmentHistory &&
    justification.systemStability
  );
}
