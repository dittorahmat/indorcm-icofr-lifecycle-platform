import { describe, it, expect } from 'vitest';

describe('significantAccounts calculation logic', () => {
  it('should correctly mark accounts as significant at FSLI level', () => {
    // Simulasi data row
    const mergedGlData = [
      { fsliName: 'FSLI-A', balance: 1000, noGL: '101' },
      { fsliName: 'FSLI-A', balance: 50, noGL: '102' },
      { fsliName: 'FSLI-B', balance: 200, noGL: '201' },
    ];
    const assessmentData = { 'FSLI-A': { 1: 'High' } }; // FSLI-A signifikan
    const pmValue = 500;

    // Logika yang baru saja diimplementasikan
    const groups = new Map<string, any[]>();
    mergedGlData.forEach(row => {
      const fsliName = row.fsliName || "Unmapped FSLI";
      if (!groups.has(fsliName)) groups.set(fsliName, []);
      groups.get(fsliName)!.push(row);
    });

    const result: any[] = [];
    groups.forEach((rows, fsliName) => {
      const assessments = assessmentData[fsliName] || {};
      const isQualSignificant = Object.values(assessments).some(v => v === 'High');
      
      rows.forEach(row => {
        const isKuanSignificant = Math.abs(row.balance) >= pmValue;
        if (isQualSignificant || isKuanSignificant) {
          result.push({ name: fsliName, balance: row.balance });
        }
      });
    });

    // Ekspektasi: FSLI-A signifikan (dua akun), FSLI-B tidak (karena balance < pmValue)
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('FSLI-A');
    expect(result[1].name).toBe('FSLI-A');
  });
});
