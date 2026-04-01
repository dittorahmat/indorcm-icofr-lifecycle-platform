## Context

**Current State:**
- 2 GL upload components dengan kemampuan berbeda:
  - GLDataIntake.tsx: Support Excel + CSV, ada Benford analysis, balance check
  - GLUploadDialog.tsx: CSV only, simple mapping
- Keduanya tidak bisa baca format Sample Data GL.csv (delimiter semicolon, kolom No_GL/GL_Desc/GL_Balance)
- Column mapping hardcoded ke nama kolom Inggris (Account, Balance)
- Balance parser tidak handle format Indonesia (spasi, parentheses, period separator)

**Constraints:**
- Harus backward compatible dengan format CSV yang sudah ada
- Tidak boleh break existing GL upload functionality
- Performance: file GL bisa 1000+ rows
- User experience: minimal user configuration, auto-detect

**Stakeholders:**
- Line 2 (ICOFR Manager): Upload GL untuk scoping
- Admin: Configure PM threshold
- External Auditor: Review GL data integrity

## Goals / Non-Goals

**Goals:**
- Support multiple GL column naming conventions (No_GL, GL_Desc, GL_Balance, etc.)
- Auto-detect delimiter (comma vs semicolon)
- Parse Indonesian number format correctly
- Filter empty rows automatically
- Support FSLI code mapping
- Consolidate GL upload components
- Provide downloadable template

**Non-Goals:**
- Backend GL persistence (tetap di frontend state)
- Multi-file upload batch processing
- GL data editing capability
- Export GL to other formats

## Decisions

### 1. Column Mapping Strategy

**Decision**: Flexible mapping dengan priority order

**Implementation:**
```typescript
const columnMapping = {
  accountCode: ['No_GL', 'Kode_GL', 'AccountCode', 'Account Code', 'Code', 'Kode_Entity'],
  accountName: ['GL_Desc', 'GLDesc', 'AccountName', 'Account Name', 'Account', 'Description'],
  balance: ['GL_Balance', 'GLBalance', 'Balance', 'Amount', 'EndingBalance', 'Saldo'],
  fsliCode: ['Kode_FSLI', 'FSLICode', 'FSLI_Code', 'FSLI'],
  entityCode: ['Kode_Entity', 'EntityCode', 'Entity_Code', 'Kode_Cabang'],
  currency: ['Kode_Valuta', 'Currency', 'Valuta', 'Curr']
};

// Auto-detect: cari kolom yang match dengan priority order
function detectColumns(headers: string[]): Mapping {
  const mapping = {};
  headers.forEach(header => {
    Object.entries(columnMapping).forEach(([field, variations]) => {
      if (variations.includes(header) && !mapping[field]) {
        mapping[field] = header;
      }
    });
  });
  return mapping;
}
```

**Rationale:**
- Support berbagai format GL tanpa user configuration
- Priority order pastikan mapping yang paling relevant dipilih
- Extensible untuk format baru

**Alternatives Considered:**
- User manual mapping (seperti Excel Import Wizard) → terlalu kompleks untuk MVP
- AI-based column detection → overkill, rule-based sudah cukup

### 2. Balance Parser

**Decision**: Multi-step parser dengan validation

**Implementation:**
```typescript
function parseBalance(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  let cleaned = value.trim();
  
  // Handle parentheses for negative
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) cleaned = cleaned.slice(1, -1);
  
  // Remove spaces
  cleaned = cleaned.replace(/\s/g, '');
  
  // Remove thousand separator (period in Indonesian format)
  cleaned = cleaned.replace(/\./g, '');
  
  // Convert comma to period for decimal
  cleaned = cleaned.replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) throw new Error(`Invalid balance format: ${value}`);
  
  return isNegative ? -parsed : parsed;
}
```

**Rationale:**
- Handle semua variasi format yang ditemukan di Sample Data GL.csv
- Validation untuk catch parsing errors early
- Clear error messages untuk user

### 3. Delimiter Auto-Detection

**Decision**: Use PapaParse auto-detection

**Implementation:**
```typescript
Papa.parse(file, {
  delimiter: '', // Auto-detect
  skipEmptyLines: true,
  complete: (results) => {
    // Process results
  }
});
```

**Rationale:**
- PapaParse sudah reliable untuk delimiter detection
- Support comma, semicolon, tab, pipe
- No extra code needed

### 4. Component Consolidation

**Decision**: Enhance GLDataIntake sebagai main component, deprecate GLUploadDialog

**Implementation:**
- GLDataIntake support CSV upload (currently Excel only via XLSX library)
- Add column auto-detection to GLDataIntake
- Add balance parser
- Remove GLUploadDialog dari ScopingPage
- Keep Benford analysis (unique value!)

**Rationale:**
- GLDataIntake lebih feature-complete (Benford, balance check)
- Avoid code duplication
- Better UX dengan single consolidated component

**Alternatives Considered:**
- Create new GLUploadComponent v2 → lebih banyak work, migration complexity
- Keep both components → maintenance burden, user confusion

### 5. Empty Row Handling

**Decision**: Auto-filter dengan validation feedback

**Implementation:**
```typescript
const validRows = rawRows.filter(row => {
  const hasData = Object.values(row).some(val => 
    val !== null && val !== undefined && val.toString().trim() !== ''
  );
  return hasData;
});

const emptyRowCount = rawRows.length - validRows.length;
if (emptyRowCount > 0) {
  toast.info(`Filtered ${emptyRowCount} empty rows`);
}
```

**Rationale:**
- Sample Data GL.csv has 400+ empty rows
- Auto-filter improve UX
- Inform user tentang filtering

## Risks / Trade-offs

**[Risk]** Column auto-detection bisa salah mapping untuk format GL yang tidak umum

**→ Mitigation:**
- Show preview dengan detected mapping sebelum import
- Allow user to manually override mapping (future enhancement)
- Log detection untuk debugging

**[Risk]** Balance parser gagal untuk format yang tidak terduga

**→ Mitigation:**
- Validation dengan clear error messages
- Show sample of expected format
- Fallback to 0 untuk invalid values dengan warning

**[Risk]** Performance issue untuk file GL besar (10000+ rows)

**→ Mitigation:**
- PapaParse streaming untuk file besar
- Show only first 100 rows in preview
- Background processing dengan loading indicator

**[Risk]** Breaking existing GL upload functionality

**→ Mitigation:**
- Maintain backward compatibility dengan existing column names
- Test dengan format CSV yang sudah ada
- Gradual rollout: enhance GLDataIntake, keep GLUploadDialog sampai verified

**[Trade-off]** Auto-detection vs Manual Control

**→ Acceptable** karena:
- Majority user prefer simplicity
- Can add manual override later if needed
- Auto-detection accuracy >95% untuk format umum

## Migration Plan

### Steps to Deploy

1. **Enhance GLDataIntake.tsx**
   - Add column auto-detection
   - Add balance parser
   - Add semicolon delimiter support
   - Add empty row filtering

2. **Update ScopingPage.tsx**
   - Replace GLUploadDialog dengan GLDataIntake
   - Update props integration

3. **Add Template Download**
   - Create sample GL template (CSV + XLSX)
   - Add download button

4. **Testing**
   - Test dengan Sample Data GL.csv
   - Test dengan format CSV existing
   - Test edge cases (empty rows, invalid balances)

5. **Documentation**
   - Update README dengan supported GL formats
   - Add sample template

### Rollback Strategy

- Revert GLDataIntake.tsx ke versi sebelumnya
- Restore GLUploadDialog di ScopingPage
- No database changes, safe rollback

## Open Questions

1. **Should we add manual column mapping UI?**
   - For edge cases where auto-detection fails
   - Adds complexity, defer to v2

2. **Should GL data be persisted to backend?**
   - Currently only in frontend state
   - Future enhancement: API endpoint untuk save GL

3. **Support multi-sheet Excel files?**
   - Currently only first sheet
   - Future enhancement: let user select sheet
