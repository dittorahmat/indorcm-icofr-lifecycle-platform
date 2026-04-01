## ADDED Requirements

### Requirement: Mining Risk Library - Reserve Estimation Risks

Sistem SHALL provide 2-3 risks related to coal reserve/resource estimation.

**Risks:**
1. "Kegagalan pencatatan cadangan batubara (coal reserves) yang tidak sesuai standar KCMI/JORC."
   - Assertions: Accuracy, Valuation, Completeness
   
2. "Ketidakakuratan estimasi volume dan kualitas batubara berdasarkan studi feasibilitas."
   - Assertions: Accuracy, Valuation

3. "Perubahan signifikan atas estimasi cadangan akibat update geological model tanpa dokumentasi memadai."
   - Assertions: Completeness, Accuracy

#### Scenario: Reserve risks available
- **WHEN** user creates RCM untuk Reserve Management
- **THEN** sistem suggest reserve estimation risks

### Requirement: Mining Risk Library - Production Measurement Risks

Sistem SHALL provide 2-3 risks related to production volume measurement.

**Risks:**
1. "Ketidakakuratan pengukuran volume produksi batubara (weighbridge, stockpile survey)."
   - Assertions: Accuracy, Completeness
   
2. "Perbedaan signifikan antara hasil stockpile survey (drone) dengan catatan sistem."
   - Assertions: Accuracy, Existence

3. "Kesalahan penentuan moisture content mengakibatkan overstatement clean coal production."
   - Assertions: Accuracy, Valuation

#### Scenario: Production risks available
- **WHEN** user creates RCM untuk Production
- **THEN** sistem suggest production measurement risks

### Requirement: Mining Risk Library - Revenue Recognition Risks

Sistem SHALL provide 3-4 risks related to revenue recognition.

**Risks:**
1. "Pengakuan pendapatan (revenue recognition) yang terlalu dini sebelum pemenuhan kewajiban performa (transfer of control)."
   - Assertions: Cut-off, Occurrence
   
2. "Kesalahan perhitungan harga jual batubara berdasarkan HBA (Harga Batubara Acuan) dengan adjustment kualitas (GAR, NAR, Total Moisture, Ash)."
   - Assertions: Accuracy, Valuation

3. "Pendapatan dari penjualan batubara ke pihak berelasi (related party) tidak diungkapkan secara memadai."
   - Assertions: Presentation, Completeness

4. "Selisih kurs mata uang asing atas penjualan ekspor tidak diakui dengan benar."
   - Assertions: Accuracy, Completeness

#### Scenario: Revenue risks available
- **WHEN** user creates RCM untuk Revenue
- **THEN** sistem suggest revenue recognition risks

### Requirement: Mining Risk Library - Cost Classification Risks

Sistem SHALL provide 2-3 risks related to cost classification.

**Risks:**
1. "Salah klasifikasi antara biaya kapital (capex) dan biaya operasional (opex) untuk overburden removal costs."
   - Assertions: Classification, Accuracy
   
2. "Biaya pengembangan tambang (mine development) tidak dikapitalisasi dengan benar sesuai PSAK."
   - Assertions: Accuracy, Classification

3. "Biaya reklamasi yang seharusnya menjadi provisi (ARO) diakui sebagai beban periode berjalan."
   - Assertions: Classification, Completeness

#### Scenario: Cost classification risks available
- **WHEN** user creates RCM untuk Fixed Assets atau Production
- **THEN** sistem suggest cost classification risks

### Requirement: Mining Risk Library - Reclamation Provision Risks

Sistem SHALL provide 2-3 risks related to reclamation and ARO.

**Risks:**
1. "Kesalahan pengakuan kewajiban pemulihan lingkungan (Asset Retirement Obligation - AARO) yang tidak sesuai PSAK."
   - Assertions: Valuation, Completeness
   
2. "Provisi reklamasi (reclamation provision) tidak diperbarui sesuai perubahan rencana reklamasi dan biaya estimasi."
   - Assertions: Valuation, Completeness

3. "Biaya reklamasi progresif tidak dicatat sebagai pengurang provisi reklamasi."
   - Assertions: Completeness, Accuracy

#### Scenario: Reclamation risks available
- **WHEN** user creates RCM untuk Reclamation
- **THEN** sistem suggest ARO/reclamation risks

### Requirement: Mining Risk Library - Royalty & Tax Compliance Risks

Sistem SHALL provide 2-3 risks related to royalty and tax.

**Risks:**
1. "Perhitungan dan pembayaran royalty produksi batubara tidak sesuai dengan ketentuan pemerintah (Permen ESDM)."
   - Assertions: Accuracy, Completeness
   
2. "Alokasi penjualan batubara antara DMO (Domestic Market Obligation) dan ekspor tidak dihitung dengan benar, mengakibatkan kesalahan perhitungan royalty."
   - Assertions: Accuracy, Completeness

3. "Kewajiban perpajakan khusus pertambangan (PPh pasal 22, royalty deductible) tidak dihitung dan disetor dengan benar."
   - Assertions: Accuracy, Completeness

#### Scenario: Royalty risks available
- **WHEN** user creates RCM untuk Royalty & Tax
- **THEN** sistem suggest royalty compliance risks

### Requirement: Mining Risk Library - Environmental Compliance Risks

Sistem SHALL provide 2-3 risks related to environmental compliance.

**Risks:**
1. "Kegagalan kepatuhan terhadap ketentuan lingkungan hidup (AMDAL, UKL-UPL) mengakibatkan sanksi administratif atau denda."
   - Assertions: Completeness, Occurrence
   
2. "Tidak terdapat persetujuan/revisi AMDAL untuk perluasan area tambang."
   - Assertions: Completeness, Occurrence

3. "Kewajiban pelaporan lingkungan triwulanan tidak disampaikan tepat waktu kepada Kementerian LHK."
   - Assertions: Completeness, Cut-off

#### Scenario: Environmental risks available
- **WHEN** user creates RCM untuk Environmental
- **THEN** sistem suggest environmental compliance risks

### Requirement: Risk Library Integration

Sistem SHALL integrate risk library dengan RCM creation workflow.

**Behavior:**
- Risk library filtered by cluster (Industri Mineral dan Batubara)
- User can select multiple risks saat create RCM
- Selected risks auto-populate riskDescription di RCM

#### Scenario: Risk suggestion
- **WHEN** user creates new RCM
- **AND** selects process "Revenue & Receivables"
- **THEN** sistem suggest 3-4 revenue-related risks dari library

#### Scenario: Risk selection
- **WHEN** user selects risk dari library
- **THEN** riskDescription auto-filled dengan selected risk text
