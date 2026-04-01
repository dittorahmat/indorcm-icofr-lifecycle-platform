## Why

Untuk tahap demo, kita perlu menunjukkan full end-to-end flow ICOFR lifecycle tanpa batasan role-based. Ini memungkinkan presenter demo untuk:
- Menampilkan semua fitur tanpa perlu switch role
- Demonstrasi lengkap dari Line 1, 2, dan 3 perspective
- Flexible workflow untuk berbagai scenario demo

## What Changes

- **Remove role-based access restrictions** dari semua halaman
- **Keep role indicator** untuk display purposes saja
- **All Lines can access all features** untuk demo flexibility

## Capabilities

### Modified Capabilities

- `role-based-access`: Removed untuk demo purpose
- `testing-workbench`: Accessible by all Lines
- `deficiency-board`: Accessible by all Lines  
- `csa-workspace`: Accessible by all Lines

## Impact

- `src/pages/testing/TestWorkbench.tsx`: Remove Line 3 only restriction
- `src/pages/deficiencies/DeficiencyBoard.tsx`: Remove Line 2/3 only restriction
- `src/pages/csa/CSAWorkspace.tsx`: Remove Line 1/2 only restriction
- `src/pages/import/ImportPage.tsx`: Remove Line 2 only restriction
- `src/pages/scoping/ScopingPage.tsx`: Remove Line 2 only features
- `src/pages/rcm/RCMList.tsx`: Remove Line 2 validation restrictions


## Context

**Current Restrictions:**
```
TestWorkbench.tsx:       Line 3 only
DeficiencyBoard.tsx:     Line 2, Line 3, Admin only
CSAWorkspace.tsx:        Line 1, Line 2 only
ImportPage.tsx:          Line 2 only
ScopingPage.tsx:         Line 2 only (GL Upload, ERP Sync)
RCMList.tsx:             Line 2 validation only
```

**After Changes:**
```
All pages: Accessible by all Lines (Line 1, Line 2, Line 3, Admin)
```

**Stakeholders:**
- Demo presenters - flexibility untuk show semua fitur
- Sales team - bisa demo full capability tanpa limitation
- Training - user bisa explore semua fungsi

## Goals / Non-Goals

**Goals:**
- Remove semua access restriction checks
- Keep UI functional untuk semua roles
- Maintain audit trail functionality (untuk demo)
- Keep role selector di login (untuk display)

**Non-Goals:**
- Remove role system entirely (masih perlu untuk audit trail)
- Change data model atau schema
- Remove audit logging

## Decisions

### 1. Approach

**Decision**: Conditional rendering removal - hapus if statements yang block access

**Rationale:**
- Simplest approach - hanya remove checks
- Reversible - mudah restore jika perlu
- No breaking changes - data model tetap sama

**Alternatives Considered:**
- Add "Demo Mode" toggle: More complex, perlu state management
- Remove role entirely: Breaking change, affect audit trail
- Keep restrictions: Defeats purpose of demo flexibility

### 2. UI Indicators

**Decision**: Keep role badge di header untuk reference

**Rationale:**
- User masih perlu tahu current role context
- Audit trail masih log berdasarkan role
- Visual consistency maintained

## Risks / Trade-offs

**[Security Model Bypassed]** → Demo mode tidak mencerminkan production security
- *Mitigation*: Clear documentation bahwa ini untuk demo only
- *Mitigation*: Production deployment perlu revert changes

**[User Confusion]** → User mungkin bingung tentang actual role boundaries
- *Mitigation*: Training materials harus clarify demo vs production
- *Mitigation*: UI labels bisa tambahkan "[DEMO MODE]" indicator

**[Audit Trail Impact]** → Role-based audit trail mungkin kurang meaningful
- *Mitigation*: Audit logging tetap record actual role yang login
- *Mitigation*: Demo data can be clearly marked

## Migration Plan

**Files to Modify:**
1. `TestWorkbench.tsx` - Remove Line 3 check
2. `DeficiencyBoard.tsx` - Remove Line 2/3 check
3. `CSAWorkspace.tsx` - Remove Line 1/2 check
4. `ImportPage.tsx` - Remove Line 2 check
5. `ScopingPage.tsx` - Remove Line 2 checks
6. `RCMList.tsx` - Remove Line 2 validation checks

**Testing:**
1. Login sebagai Line 1, akses semua halaman
2. Login sebagai Line 2, akses semua halaman
3. Login sebagai Line 3, akses semua halaman
4. Verify audit trail masih record role

**Deployment:**
- Single commit dengan semua perubahan
- Document sebagai "DEMO MODE" dalam release notes
- Create branch `demo-unrestricted` untuk tracking

## Open Questions

1. **Should we add visual indicator** that app is in "Demo Mode"?
   - Badge di header: "DEMO - All Access"
   - Toast notification on login
   - Watermark di beberapa halaman

2. **Should we keep "External Auditor" restriction?**
   - Option A: Remove juga - semua bisa akses audit portal
   - Option B: Keep - karena ini specific untuk external party
   - Recommendation: Remove untuk demo consistency

3. **Demo data cleanup?**
   - Perlu script untuk reset demo data setelah presentation?
   - Atau cukup document manual reset procedure?
