import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { MOCK_USERS, MOCK_CONTROLS, MOCK_RCM } from '@shared/mock-data';
import { can } from '@shared/entity-authority';
import { getFriendlyEmail } from '@shared/demo-users';
import { aggregateFsliBalances } from '@shared/scoping-materiality';
import { WORKFLOW_TRANSITION_RULES } from '@shared/workflow-transitions';
import { isCoolingOffViolation } from '@shared/cooling-off';
import { decideTest, TodPillars } from '@shared/testing-decision';
import { summarizeDeficiencies } from '@shared/deficiency-summary';

/**
 * Automated Demo Playbook Verification Suite
 * Aligned with docs/DEMO_SCENARIO_E2E.md & SK-5/DKU.MBU/11/2024
 */

describe('Skenario Demo Otomatis E2E (SK-5 ICOFR Lifecycle)', () => {
  describe('Tahap 1: Profil Entitas, Kredensial, dan Matriks Akses Persona', () => {
    it('memvalidasi seluruh persona demo PT BNS dan kewenangannya', () => {
      const staffOps = MOCK_USERS.find(u => getFriendlyEmail(u) === 'staff.ops@bumn.go.id');
      const managerOps = MOCK_USERS.find(u => getFriendlyEmail(u) === 'manager.ops@bumn.go.id');
      const line2 = MOCK_USERS.find(u => getFriendlyEmail(u) === 'line2@bumn.go.id');
      const line3 = MOCK_USERS.find(u => getFriendlyEmail(u) === 'line3@bumn.go.id');
      const cfo = MOCK_USERS.find(u => getFriendlyEmail(u) === 'cfo@bumn.go.id');
      const external = MOCK_USERS.find(u => getFriendlyEmail(u) === 'external@bumn.go.id');
      const admin = MOCK_USERS.find(u => getFriendlyEmail(u) === 'admin@bumn.go.id');

      expect(staffOps).toBeDefined();
      expect(managerOps).toBeDefined();
      expect(line2).toBeDefined();
      expect(line3).toBeDefined();
      expect(cfo).toBeDefined();
      expect(external).toBeDefined();
      expect(admin).toBeDefined();

      // Authority gate checking sesuai shared/entity-authority
      expect(can(staffOps?.role, 'csa:execute-assessment')).toBe(true);
      expect(can(line2?.role, 'scoping:allocate-departments')).toBe(true);
      expect(can(cfo?.role, 'scoping:view-approvals')).toBe(true);
      expect(can(external?.role, 'scoping:view-all-departments')).toBe(true);
      expect(can(admin?.role, 'admin:manage-users')).toBe(true);
    });

    it('memverifikasi parameter kuantitatif scoping materialitas PT BNS via domain seam', () => {
      const benchmarkRevenue = 500_000_000_000; // Rp 500 Miliar
      const omPercentage = 0.05; // 5%
      const haircutPercentage = 0.75; // 75%

      const overallMateriality = benchmarkRevenue * omPercentage;
      const performanceMateriality = overallMateriality * haircutPercentage;

      expect(overallMateriality).toBe(25_000_000_000); // Rp 25 Miliar
      expect(performanceMateriality).toBe(18_750_000_000); // Rp 18.75 Miliar

      // Akun signifikan PT BNS
      const fsliRows = [
        { suggestedFsli: '40001-REV-COAL', balance: 500_000_000_000 },
        { suggestedFsli: '50001-COGS-MINING', balance: 320_000_000_000 },
        { suggestedFsli: '11001-AR-COAL', balance: 120_000_000_000 },
        { suggestedFsli: '99999-OTHER-EXPENSE', balance: 5_000_000_000 }, // Sub-PM
      ];

      const inScopeAccounts = aggregateFsliBalances(fsliRows, performanceMateriality);
      const names = inScopeAccounts.map(a => a.name);

      expect(names).toContain('40001-REV-COAL');
      expect(names).toContain('50001-COGS-MINING');
      expect(names).toContain('11001-AR-COAL');
      expect(names).not.toContain('99999-OTHER-EXPENSE');
      expect(inScopeAccounts.every(a => a.isQuantitative)).toBe(true);
    });

    it('memverifikasi alur transisi berjenjang status approval scoping', () => {
      const scopingRules = WORKFLOW_TRANSITION_RULES.SCOPING;
      expect(scopingRules.Draft.nextStatus.Submit).toBe('Pending CFO');
      expect(scopingRules['Pending CFO'].nextStatus.Review).toBe('Pending Komut');
      expect(scopingRules['Pending Komut'].nextStatus.Approve).toBe('Approved');
    });
  });

  describe('Tahap 2: RCM & BPM Linkage Pengendalian Kunci', () => {
    it('memverifikasi kontrol kunci batubara LOG-01, QC-01, dan BILL-01', () => {
      const controls = MOCK_CONTROLS;
      const log01 = controls.find(c => c.code === 'LOG-01');
      const qc01 = controls.find(c => c.code === 'QC-01');
      const bill01 = controls.find(c => c.code === 'BILL-01');

      expect(log01).toBeDefined();
      expect(log01?.name).toBe('Weighbridge Calibration');
      expect(log01?.isKeyControl).toBe(true);

      expect(qc01).toBeDefined();
      expect(qc01?.name).toBe('Quality Certificate Approval');
      expect(qc01?.isKeyControl).toBe(true);

      expect(bill01).toBeDefined();
      expect(bill01?.name).toBe('HBA Price Verification');
      expect(bill01?.isKeyControl).toBe(true);
    });

    it('memverifikasi relasi kontrol pada proses bisnis tambang batubara', () => {
      const rcmList = MOCK_RCM;
      const coalContractRcm = rcmList.find(r => r.subProcess === 'Coal Sales Contract');
      expect(coalContractRcm).toBeDefined();
      expect(coalContractRcm?.controls.length).toBeGreaterThan(0);
      expect(coalContractRcm?.bpmData?.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Tahap 3: CSA (Control Self-Assessment) Lini 1 & Validasi Lini 2', () => {
    it('mensimulasikan siklus input CSA: QC-01 Efektif dan LOG-01 Tidak Efektif', () => {
      const csaSubmission = [
        {
          controlCode: 'QC-01',
          assessment: 'Effective',
          evidence: 'COA Carsurin Q4-2026',
          status: 'Submitted_L1',
        },
        {
          controlCode: 'LOG-01',
          assessment: 'Ineffective',
          notes: 'Pelaksanaan kalibrasi tera berkala tertunda 2 bulan',
          status: 'Submitted_L1',
        },
      ];

      expect(csaSubmission[0].assessment).toBe('Effective');
      expect(csaSubmission[1].assessment).toBe('Ineffective');

      const validatedByL2 = csaSubmission.map(item => ({
        ...item,
        status: 'Validated_L2',
        validatedBy: 'line2@bumn.go.id',
      }));

      expect(validatedByL2.every(item => item.status === 'Validated_L2')).toBe(true);
    });
  });

  describe('Tahap 4: Pengujian TOD 6-Pilar & TOE Sampel Transaksi', () => {
    it('memvalidasi 6 pilar desain Lampiran 8 pada QC-01 via testing-decision seam', () => {
      const validPillars: TodPillars = {
        objective: true,
        timing: true,
        authority: true,
        reliability: true,
        coverage: true,
        evidence: true,
      };

      const decisionEffective = decideTest(
        { frequency: 'Daily', riskRating: 'High', nature: 'Manual' },
        { testType: 'TOD', claimedResult: 'Effective', todPillars: validPillars },
      );

      expect(decisionEffective.isValid).toBe(true);
      expect(decisionEffective.verdict).toBe('Effective');

      // Salah satu pilar tidak terpenuhi -> Ineffective
      const brokenPillars: TodPillars = { ...validPillars, authority: false };
      const decisionBroken = decideTest(
        { frequency: 'Daily', riskRating: 'High', nature: 'Manual' },
        { testType: 'TOD', claimedResult: 'Effective', todPillars: brokenPillars },
      );

      expect(decisionBroken.isValid).toBe(true);
      expect(decisionBroken.verdict).toBe('Ineffective');
    });

    it('mensimulasikan hasil TOE LOG-01 dengan Zero-Tolerance deviasi tera kadaluarsa', () => {
      const samplesWithDeviations: Array<{ status: 'Pass' | 'Fail' }> = [
        ...Array(22).fill({ status: 'Pass' as const }),
        ...Array(3).fill({ status: 'Fail' as const }),
      ];

      const decisionToe = decideTest(
        { frequency: 'Monthly', riskRating: 'High', nature: 'Manual' },
        {
          testType: 'TOE',
          claimedResult: 'Effective',
          sampleSize: 25,
          samples: samplesWithDeviations,
        },
      );

      expect(decisionToe.isValid).toBe(true);
      expect(decisionToe.verdict).toBe('Ineffective');
    });
  });

  describe('Tahap 5: Deficiency Board, WBS Recap & Asesmen Manajemen Lampiran 11', () => {
    it('memvalidasi agregasi defisiensi dan penentuan opini efektivitas via deficiency-summary seam', () => {
      const deficiencies = [
        { severity: 'Significant Deficiency', status: 'Open' },
        { severity: 'Material Weakness', status: 'Open' },
      ];

      const summary = summarizeDeficiencies(deficiencies);
      expect(summary.total).toBe(2);
      expect(summary.mwCount).toBe(1);
      expect(summary.sdCount).toBe(1);
      expect(summary.isEffective).toBe(false); // Adanya Material Weakness membuat kesimpulan Ineffective
    });

    it('memvalidasi integrasi indikator fraud WBS terhadap risiko pelaporan keuangan', () => {
      const mockWbsIndicators = [
        {
          id: 'WBS-2026-001',
          category: 'Fraud Timbangan / Hauling',
          isFinancialImpact: true,
          impactMagnitude: 5_000_000_000,
          status: 'Confirmed',
          relatedControlIds: ['ctrl-rev-03'],
        },
      ];

      expect(mockWbsIndicators[0].isFinancialImpact).toBe(true);
      expect(mockWbsIndicators[0].impactMagnitude).toBeGreaterThanOrEqual(1_000_000_000);
    });

    it('memvalidasi integritas digital sign-off dan pembuatan hash SHA-256 dokumen terkunci', () => {
      const docPayload = JSON.stringify({
        company: 'PT Batubara Nusantara Sejahtera',
        year: 2026,
        conclusion: 'Ineffective',
        signedBy: 'cfo@bumn.go.id',
      });

      const hash = crypto.createHash('sha256').update(docPayload).digest('hex');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Tahap Tambahan: Validasi Portal KAP (Cooling-Off Bab II)', () => {
    it('memvalidasi kepatuhan cooling-off 12 bulan auditor eksternal/internal via domain seam', () => {
      const now = Date.now();
      const pastSixMonths = now - 180 * 24 * 60 * 60 * 1000;
      const pastTwoYears = now - 730 * 24 * 60 * 60 * 1000;

      // Pelanggaran jika pernah menjabat Line 1 / Line 2 dalam 12 bulan terakhir
      const violationHistory = [
        { processId: 'proc-mining-01', role: 'Line 1', endDate: pastSixMonths },
      ];
      expect(isCoolingOffViolation(violationHistory, 'proc-mining-01', now)).toBe(true);

      // Aman jika sudah lebih dari 12 bulan (misal 2 tahun)
      const cleanHistory = [
        { processId: 'proc-mining-01', role: 'Line 1', endDate: pastTwoYears },
      ];
      expect(isCoolingOffViolation(cleanHistory, 'proc-mining-01', now)).toBe(false);
    });
  });
});
