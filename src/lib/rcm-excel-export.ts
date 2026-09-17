import * as XLSX from 'xlsx';

export interface RCMExportOptions {
  sheetName?: string;
  matrixType?: 'TLC' | 'ELC' | 'ITGC';
  filename?: string;
}

/**
 * Maps raw matrix data rows into clean, human-readable audit spreadsheet columns
 */
export function exportRCMToExcel(data: any[], options: RCMExportOptions = {}) {
  const {
    matrixType = 'TLC',
    sheetName = `${matrixType} Matrix`,
    filename = `RCM_${matrixType}_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`
  } = options;

  const rows = data.map((item, index) => {
    const parentProcess = item.parentProcessName || item.processName || '-';
    const subProcess = item.subProcessName || item.subProcess || '-';

    if (matrixType === 'ELC') {
      return {
        'No': index + 1,
        'COSO Component': item.cosoComponent || '-',
        'COSO Principle': item.cosoPrinciple || '-',
        'Control Code': item.code || item.controlCode || '-',
        'Control Name': item.mappedControlName || item.name || '-',
        'Control Description': item.mappedControlDescription || item.description || '-',
        'Supporting Documents': item.supportingDocs || '-',
        'Key Control': item.isKeyControl ? 'Y' : 'N',
        'Frequency': item.frequency || '-',
        'Control Type': item.type || item.controlType || '-',
        'Control Nature': item.nature || item.controlNature || '-',
        'Executing Function': item.executingFunction || '-',
        'Executor Role': item.executorRole || '-',
        'Company': item.companyName || '-',
        'Effective Period': item.effectivePeriod || '-'
      };
    }

    if (matrixType === 'ITGC') {
      return {
        'No': index + 1,
        'Domain ITGC': item.itgcDomain || '-',
        'Process Information': parentProcess,
        'Sub Process': subProcess,
        'Risk Description': item.riskDescription || '-',
        'Risk Rating': item.riskRating || '-',
        'Control Code': item.controlCode || item.code || '-',
        'Control Name': item.mappedControlName || item.baseControlName || item.name || '-',
        'Control Description': item.mappedControlDescription || item.baseControlDescription || item.description || '-',
        'Supporting Documents': item.supportingDocs || '-',
        'Key Control': item.isKeyControl ? 'Y' : 'N',
        'Control Type': item.controlType || '-',
        'Control Nature': item.controlNature || '-',
        'Automated Type': item.automatedSubNature || '-',
        'Frequency': item.frequency || '-',
        'Supporting App': item.supportingApp || '-',
        'Executing Function': item.executingFunction || '-',
        'Executor Role': item.executorRole || '-',
        'Company': item.companyName || '-',
        'Effective Period': item.effectivePeriod || '-'
      };
    }

    // Default: TLC Matrix
    return {
      'No': index + 1,
      'Proses Bisnis (Parent)': item.parentBpmCode ? `${parentProcess} [${item.parentBpmCode}]` : parentProcess,
      'Sub-Proses (Child)': subProcess,
      'FSLI': item.fsliName || '-',
      'No GL': item.noGL || '-',
      'Company': item.companyName || '-',
      'Location': item.locationCode || '-',
      'Risk Description': item.riskDescription || '-',
      'Fraud': item.isFraudRelated ? 'Y' : 'N',
      'Risk Rating': item.riskRating || '-',
      'Control Code': item.controlCode || item.code || '-',
      'Control Name': item.mappedControlName || item.baseControlName || item.name || '-',
      'Control Description': item.mappedControlDescription || item.baseControlDescription || item.description || '-',
      'Supporting Documents': item.supportingDocs || '-',
      'Key Control': item.isKeyControl ? 'Y' : 'N',
      // IPO
      'IPO - C': item.ipoC === 'Y' ? 'Y' : 'N',
      'IPO - A': item.ipoA === 'Y' ? 'Y' : 'N',
      'IPO - V': item.ipoV === 'Y' ? 'Y' : 'N',
      'IPO - RA': item.ipoRa === 'Y' ? 'Y' : 'N',
      // Assertions
      'Assertion - E/O': item.assertionE === 'Y' ? 'Y' : 'N',
      'Assertion - C': item.assertionC === 'Y' ? 'Y' : 'N',
      'Assertion - A': item.assertionA === 'Y' ? 'Y' : 'N',
      'Assertion - CO': item.assertionCo === 'Y' ? 'Y' : 'N',
      'Assertion - R&O': item.assertionRo === 'Y' ? 'Y' : 'N',
      'Assertion - V/A': item.assertionVa === 'Y' ? 'Y' : 'N',
      'Assertion - PD': item.assertionPd === 'Y' ? 'Y' : 'N',
      // Control Attributes
      'Control Type': item.controlType || '-',
      'Control Nature': item.controlNature || '-',
      'Automated Type': item.automatedSubNature || '-',
      'Frequency': item.frequency || '-',
      'Supporting App': item.supportingApp || '-',
      'Executing Function': item.executingFunction || '-',
      'Executor Role': item.executorRole || '-',
      'Affected FSLI': item.affectedFsliItem || '-',
      'Effective Period': item.effectivePeriod || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
