## Context

**Current State:**
- Sidebar group: "Deficiency"
- Menu item: "Deficiency Board"
- Route: `/deficiencies` (unchanged)
- Component: `DeficiencyBoard.tsx` (unchanged)

**Constraints:**
- Minimal changes - only relabeling
- No routing changes
- No API changes
- No functional changes

## Goals / Non-Goals

**Goals:**
- Rename sidebar group label
- Rename menu item text
- Maintain all existing functionality

**Non-Goals:**
- Component refactoring
- Route changes
- API modifications

## Decisions

### 1. Sidebar Group Label

**Decision**: "Deficiency" → "Deficiency & Remediasi"

**Rationale:**
- Mencakup kedua aspek: deficiency identification dan remediation tracking
- Konsisten dengan SK-5/2024 terminology
- Bahasa Indonesia untuk user friendliness

### 2. Menu Item Label

**Decision**: "Deficiency Board" → "Remediation Tracker"

**Rationale:**
- "Tracker" lebih action-oriented
- "Remediation" lebih eksplisit daripada "Board"
- User langsung paham ini untuk tracking remediasi

### 3. Icon

**Decision**: Keep `AlertTriangle`

**Rationale:**
- Sudah appropriate
- Tidak perlu perubahan visual

## Risks / Trade-offs

**[Minor]** User confusion saat transisi
- Mitigation: Clear changelog dan communication

## Migration Plan

**Files to Change:**
1. `src/components/app-sidebar.tsx` - Update 2 labels

**Testing:**
1. Visual check sidebar renders correctly
2. Click navigation works
3. Page loads correctly

**Deployment:**
- Single commit, no migration needed

## Open Questions

None.
