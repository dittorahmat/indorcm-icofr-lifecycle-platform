---
stepsCompleted:
  - Step 1: Validate Prerequisites and Extract Requirements
  - Step 2: Design Epic List
  - Step 3: Generate Epics and Stories
  - Step 4: Final Validation
inputDocuments:
  - _bmad-output/prd/indorcm-pro-prd.md
  - .planning/codebase/ARCHITECTURE.md
  - 2024peraturan tk eselon i005.pdf
---

# IndoRCM Pro - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for IndoRCM Pro, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Smart CSV/Excel Sanitizer - Validasi struktur data GL, deteksi duplikasi, dan balance check saat upload.
FR2: Benford’s Law Shield - Analisis statistik frekuensi digit untuk deteksi manipulasi data mentah.
FR3: Auto-Scoping Engine - Kalkulasi otomatis OM dan PM berdasarkan persentase regulasi (misal: 5% dari Laba).
FR4: Dynamic Thresholds - Penyesuaian ambang batas signifikansi secara real-time berdasarkan data keuangan berjalan.
FR5: Interactive BPM Canvas - Editor diagram alur menggunakan standar visual Lampiran 3 (Hexagon untuk Risiko, Oval untuk Start/End).
FR6: Dynamic Heatmap - Visualisasi peta proses yang berubah warna berdasarkan intensitas temuan audit.
FR7: Hieroglyphic Icon Set - Penggunaan simbol visual universal sesuai regulasi.
FR8: Context-Aware CSA Wizard - Checklist evaluasi mandiri dinamis yang berubah berdasarkan anomali data.
FR9: Biometric Evidence Validation - Otentikasi wajah/sidik jari via mobile untuk pengecekan aset.
FR10: AI Document OCR - Ekstraksi teks otomatis dari bukti PDF/JPG.
FR11: Photo Metadata Forensic - Verifikasi koordinat GPS dan timestamp foto bukti.
FR12: DoD Logic Engine - Algoritma bantuan klasifikasi temuan (CD, SD, MW) sesuai Gambar 5 Regulasi.
FR13: Immutable Finding Vault - Catatan temuan yang tidak bisa dihapus.
FR14: Blind Spot Validation - Pengiriman sampel bukti secara acak ke tim validator di unit lain.
FR15: Self-Healing Control Logic - Rekomendasi jalur remediasi otomatis saat kontrol gagal.
FR16: Appendix-First Automation - Otomatisasi output PDF laporan identik dengan Lampiran 1-12 SK-5/2024.
FR17: Digital Signature Lock-In - Penguncian data tahun berjalan setelah sign-off dengan QR Code.
FR18: KPI Compliance Dashboard - Monitoring progress penyelesaian ICOFR di seluruh klaster/unit BUMN.
FR19: Auditor Cooling-Off Tracker - Monitoring masa jabatan KAP sesuai Bab II regulasi.
FR20: Whistleblowing Integration - Integrasi indikator fraud WBS ke dalam penilaian risiko ICOFR (Lampiran 1).
FR21: Equity Investee Monitoring - Modul khusus pemantauan investee non-konsolidasi (FAQ No. 5).
FR22: Automated Sample Calculator - Penentuan jumlah sampel otomatis berdasarkan frekuensi sesuai Tabel 22.

### NonFunctional Requirements

NFR1: Edge Resiliency (Offline-First) - Kemampuan pengerjaan data di lokal browser.
NFR2: Zero-Trust Data Encryption - Enkripsi data bukti audit dengan kunci dipegang entitas BUMN.
NFR3: WASM-Encoded Logic - Logika kepatuhan kritis dijalankan di WebAssembly.
NFR4: Immutable Compliance Log - Audit trail yang tidak dapat dimanipulasi teknis.
NFR5: Auditability - Setiap mutasi entitas wajib memiliki entri di ChangeLog (Lampiran 6).
NFR6: Role-Based Access Control (RBAC) - Penegakan hak akses antar Lini 1, 2, dan 3.

### Additional Requirements

- Cloudflare Workers & Durable Objects Infrastructure
- Entity Framework with Optimistic Concurrency Control (CAS)
- React 18 + TanStack Query for State Synchronization
- Standardized ApiResponse for all domain logic
- QR Code Verification Library Integration for Document Integrity

### UX Design Requirements

UX-DR1: Visualisasi BPM wajib menggunakan node Hexagon (Risiko), Oval (Start/End), dan Cylinder (Sistem/Archive) sesuai Lampiran 3.
UX-DR2: Wizard DoD wajib mengikuti alur pertanyaan Gambar 5 (7 Box keputusan).
UX-DR3: Tabel Defisiensi di Laporan Asesmen Manajemen wajib mencakup kolom FSLI, Ditemukan Oleh, dan Target Remediasi (Lampiran 11).
UX-DR4: Alert sistem untuk periode Cooling-off jika user berpindah peran dari Lini 3 ke Lini 1 dalam < 12 bulan.
UX-DR5: Integrasi visual indikator WBS pada dashboard scoping dan RCM.

### FR Coverage Map

FR1: Epic 1 Story 1.4
FR2: Epic 1 Story 1.4
FR3: Epic 1 Story 1.1
FR4: Epic 1 Story 1.5
FR5: Epic 2 Story 2.1
FR6: Epic 2 Story 2.2
FR7: Epic 2 Story 2.3
FR8: Epic 3 Story 3.1
FR9: Epic 3 Story 3.2
FR10: Epic 3 Story 3.2
FR11: Epic 3 Story 3.3
FR12: Epic 4 Story 4.1
FR13: Epic 4 Story 4.3
FR14: Epic 3 Story 3.4
FR15: Epic 4 Story 4.4
FR16: Epic 5 Story 5.1
FR17: Epic 5 Story 5.2
FR18: Epic 5 Story 5.4
FR19: Epic 1 Story 1.3
FR20: Epic 4 Story 4.2
FR21: Epic 1 Story 1.2
FR22: Epic 3 Story 3.1

## Epic List

### Epic 1: Precision Scoping & Holding Governance
Fokus pada akurasi kalkulasi materiality untuk grup BUMN, multiplier entitas anak, dan pemantauan investee sesuai FAQ No. 5.

### Epic 2: Standardized Process & Risk Visualization
Menstandarisasi editor BPM agar visualisasinya 100% patuh pada simbol Lampiran 3 (Hexagon, Oval, Cylinder) dan mendukung heatmap audit.

### Epic 3: Smart Evidence & Testing Automation
Otomatisasi penentuan jumlah sampel (Tabel 22) dan penguatan integritas bukti audit menggunakan OCR serta forensik metadata.

### Epic 4: Objective Deficiency & Remediation Lifecycle
Implementasi Wizard DoD (Gambar 5) untuk klasifikasi temuan yang objektif dan integrasi indikator fraud dari Whistleblowing System.

### Epic 5: Regulatory Compliance Reporting & Integrity
Otomatisasi Laporan Asesmen Manajemen (Lampiran 11) dengan detail tabel lengkap, penguncian data permanen, dan verifikasi QR Code.

---

## Epic 1: Precision Scoping & Holding Governance

### Story 1.1: Automatic Group Multiplier Calculation
As a Line 2, I want the system to automatically apply a multiplier based on the number of significant locations (Table 25), so that the Group Overall Materiality is compliant with SK-5/2024 regulations.
**AC:** Suggests multiplier from Table 25, updates Group OM automatically.

### Story 1.2: Equity Method Investee Monitoring (FAQ 5)
As a Line 2, I want a dedicated tab to monitor non-consolidated investees, so that I can track their audit status and materiality as mandated by FAQ No. 5.
**AC:** UI for adding investees, investment value input, and audit status tracking.

### Story 1.3: Auditor Cooling-off Validation Alert
As a System, I want to alert the user if a role change violates the 12-month cooling-off period, so that the independence of Line 1 vs Line 3 is maintained as per Bab II.
**AC:** Blocks action or shows alert if user was Line 3 within < 12 months.

### Story 1.4: Smart GL Sanitizer & Benford's Law Shield
As a Line 2, I want the system to validate GL structure and run Benford's Law analysis on upload, so that data manipulation is detected early.
**AC:** Auto-sanitization of CSV/Excel, anomaly detection for frequency digits.

### Story 1.5: Real-time Significance Threshold Adjustments
As a Risk Manager, I want the system to adjust materiality thresholds based on running financial data, so that scoping remains accurate throughout the year.
**AC:** Thresholds update automatically as monthly/quarterly balances are updated.

## Epic 2: Standardized Process & Risk Visualization

### Story 2.1: Regulatory Icon Standardization (BPM Shapes)
As a Process Owner, I want to use standardized shapes (Oval Start/End, Hexagon Risk, Cylinder System) in the BPM editor, so that my process documentation is 100% compliant with Lampiran 3 visuals.
**AC:** Nodes render as Oval (curvy), Hexagon (Red), and Cylinder (Blue).

### Story 2.2: Dynamic Risk Heatmap Visualization
As a Risk Manager, I want the BPM nodes to change color based on the number of audit findings, so that I can visually identify high-risk bottlenecks.
**AC:** Nodes turn orange/red based on deficiency density.

### Story 2.3: Hieroglyphic Icon Set Integration
As a User, I want to see universal regulatory icons for specific process types, so that the process is easy to understand cross-department.
**AC:** Regulatory icon set displayed on nodes based on category.

## Epic 3: Smart Evidence & Testing Automation

### Story 3.1: Automated Sample Size Determination (Table 22)
As a Line 3 (Auditor), I want the system to suggest the minimum sample size based on control frequency and risk rating, so that my testing plan is compliant with Tabel 22.
**AC:** Suggests 2-5 for Monthly, etc., and requires Homogeneity Justification.

### Story 3.2: AI-Powered Evidence OCR Verification
As a Control Owner, I want the system to automatically extract text from uploaded evidence, so that I can verify if it matches transaction details.
**AC:** OCR extracts Date, Amount, Vendor; highlights discrepancies.

### Story 3.3: Photo Metadata Forensic & GPS Validation
As a Validator, I want to see GPS and timestamp metadata of uploaded photos, so that I can ensure evidence authenticity.
**AC:** Displays Forensic Data (Location/Time), flags inconsistent metadata.

### Story 3.4: Blind Spot Validation (Cross-unit Sample)
As a Compliance Officer, I want the system to randomly send evidence samples to validators in different units, so that audit formality is avoided.
**AC:** Automated workflow for cross-unit validation assignment.

## Epic 4: Objective Deficiency & Remediation Lifecycle

### Story 4.1: Degree of Deficiency (DoD) Decision Wizard
As a Line 3 (Auditor), I want a step-by-step wizard based on Gambar 5, so that my classification of CD, SD, or MW is consistent.
**AC:** Follows 7-box logic from Gambar 5, calculates severity automatically.

### Story 4.2: Whistleblowing System (WBS) Risk Integration
As a Risk Manager, I want to see WBS fraud indicators as alerts during assessment, so that ICOFR scoping considers actual fraud reports.
**AC:** Displays "WBS Fraud Alert" badge on related process pages.

### Story 4.3: Immutable Finding Vault & Audit Trail
As a Compliance Officer, I want identified deficiencies to be undeletable without approval, so that audit history is integral.
**AC:** Prevents deletion, logs all changes in ChangeLog with states.

### Story 4.4: Self-Healing Remediation Recommendation
As a Control Owner, I want the system to suggest remediation paths immediately after a failure, so that mitigation is proactive.
**AC:** Auto-suggests remediation steps based on deficiency root cause.

## Epic 5: Regulatory Compliance Reporting & Integrity

### Story 5.1: Detailed Deficiency Table (Lampiran 11)
As a CEO/CFO, I want the report to include all mandatory columns (FSLI, Identified By, Target Date), so that it is 100% compliant with Lampiran 11.
**AC:** Table shows all 7 mandatory columns as per Hal 101.

### Story 5.2: Secure QR Code Document Verification
As a Stakeholder, I want to verify report authenticity via QR Code, so that document integrity is guaranteed.
**AC:** Scan redirects to verification URL with hash and timestamp.

### Story 5.3: Permanent Period Lock-In
As a Compliance Officer, I want the system to prevent data changes after sign-off, so that finalized periods are integral.
**AC:** Blocks all edits to Control/RCM/Scoping after CEO/CFO sign-off.

### Story 5.4: Global KPI Compliance Dashboard
As an Executive, I want to monitor ICOFR progress across all BUMN clusters, so that I can track group-wide compliance.
**AC:** Real-time dashboard showing status of all units and clusters.
