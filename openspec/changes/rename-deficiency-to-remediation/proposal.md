## Why

User tidak menemukan menu "Remediasi" dengan mudah karena saat ini menggunakan label "Deficiency Board". Meskipun fungsi remediasi sudah lengkap (Action Plans, Kanban board, testing readiness), naming yang tidak eksplisit menyebabkan kebingungan.

## What Changes

- **Rename Sidebar Group**: "Deficiency" → "Deficiency & Remediasi"
- **Rename Menu Item**: "Deficiency Board" → "Remediation Tracker"
- **Update Page Title**: Deficiency Board → Remediation Tracker (untuk konsistensi)

## Capabilities

### Modified Capabilities

- `deficiency-tracking`: Naming lebih eksplisit mencerminkan fungsi remediasi

## Impact

- `src/components/app-sidebar.tsx`: Update label sidebar
- `src/pages/deficiencies/DeficiencyBoard.tsx`: Update page title (optional)


## Context

**Current State:**
```tsx
<SidebarGroupLabel>Deficiency</SidebarGroupLabel>
<SidebarMenuButton>
  <AlertTriangle /> <span>Deficiency Board</span>
</SidebarMenuButton>
```

**Target State:**
```tsx
<SidebarGroupLabel>Deficiency & Remediasi</SidebarGroupLabel>
<SidebarMenuButton>
  <AlertTriangle /> <span>Remediation Tracker</span>
</SidebarMenuButton>
```

**Stakeholders:**
- Line 1 & Line 2 users - lebih mudah menemukan fitur remediasi
- External Auditor - clarity dalam audit trail

## Goals / Non-Goals

**Goals:**
- Rename sidebar group dan menu item
- Maintain semua fungsi existing (Kanban, Action Plans, DoD Wizard)
- Tidak ada breaking changes pada routing atau API

**Non-Goals:**
- Tidak ada perubahan pada DeficiencyBoard.tsx logic
- Tidak ada perubahan pada Action Plan workflow
- Tidak ada perubahan pada API endpoints

## Decisions

### 1. Naming Convention

**Decision**: Gunakan "Deficiency & Remediasi" untuk group, "Remediation Tracker" untuk menu item.

**Rationale:**
- "Deficiency & Remediasi" mencakup kedua aspek (assessment + tracking)
- "Remediation Tracker" lebih action-oriented dan jelas fungsinya
- Konsisten dengan terminology SK-5/2024

### 2. Icon Choice

**Decision**: Keep `AlertTriangle` icon (sudah appropriate untuk deficiency/remediation context)

**Rationale:**
- Icon sudah merepresentasikan warning/alert yang perlu ditindaklanjuti
- Tidak perlu perubahan visual yang membingungkan

## Risks / Trade-offs

**[User Adaptation]** → User yang sudah terbiasa dengan "Deficiency Board" mungkin butuh waktu adaptasi
- *Mitigation*: Perubahan minimal, hanya naming. Fungsi tetap sama.

**[Documentation]** → Existing documentation mungkin masih menggunakan nama lama
- *Mitigation*: Update changelog, communicate dalam release notes

## Migration Plan

**Deployment:**
1. Update `app-sidebar.tsx` - rename labels
2. Test sidebar rendering
3. Verify navigation still works
4. Update changelog

**Rollback Strategy:**
- Simple git revert jika ada issue

## Open Questions

None - straightforward UI relabeling.
