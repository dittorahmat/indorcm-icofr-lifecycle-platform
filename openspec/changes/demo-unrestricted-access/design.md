## Context

**Current State:**
- Multiple pages have role-based access checks
- Each check uses `if (mockRole !== 'Role')` pattern
- Shows "Access Denied" card when blocked

**Constraints:**
- Remove restrictions but keep code maintainable
- Easy to revert for production
- Maintain audit trail functionality

## Goals / Non-Goals

**Goals:**
- Remove all access blocking if statements
- Keep role logging for audit trail
- Maintain UI consistency

**Non-Goals:**
- Refactor entire auth system
- Remove role from data model
- Change API endpoints

## Decisions

### 1. Removal Strategy

**Decision**: Comment out or remove blocking if statements, keep helper functions

**Rationale:**
- Minimal code changes
- Easy to identify what was changed
- Reversible dengan simple uncomment

### 2. Files to Change

**Priority Order:**
1. `TestWorkbench.tsx` - Line 3 only → All Lines
2. `DeficiencyBoard.tsx` - Line 2/3 only → All Lines
3. `CSAWorkspace.tsx` - Line 1/2 only → All Lines
4. `ImportPage.tsx` - Line 2 only → All Lines
5. `ScopingPage.tsx` - Line 2 features → All Lines
6. `RCMList.tsx` - Line 2 validation → All Lines

### 3. UI Indicators

**Decision**: Add "[DEMO MODE]" badge in header when unrestricted

**Rationale:**
- Clear visual indicator bahwa ini demo mode
- User aware bahwa restrictions removed
- Professional appearance for presentations

## Risks / Trade-offs

**[Minor]** Code might look inconsistent (removed checks)
- Mitigation: Add comments explaining demo mode

**[Minor]** Audit trail role might not reflect actual user
- Mitigation: Document dalam demo guide

## Migration Plan

**Step-by-step:**
1. Remove TestWorkbench restriction (highest visibility)
2. Remove DeficiencyBoard restriction
3. Remove CSAWorkspace restriction
4. Remove Import/Scoping/RCM restrictions
5. Add DEMO MODE indicator (optional)
6. Test all pages dengan different roles

**Testing:**
- Login sebagai line1@ → akses semua halaman
- Login sebagai line2@ → akses semua halaman
- Login sebagai line3@ → akses semua halaman

**Rollback:**
- Git revert atau uncomment blocked code

## Open Questions

None - straightforward removal of access checks.
