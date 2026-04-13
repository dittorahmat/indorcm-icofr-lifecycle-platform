## Context

The application is currently branded as "IndoRCM Pro" (also written "Indo RCM Pro") across the codebase. The name appears in:

1. **UI Components**: `MainHeader.tsx`, `app-sidebar.tsx`, `LoginPage.tsx`, `HomePage.tsx`, `WelcomePage.tsx`, `ReportsPage.tsx`, `RegulatoryAppendices.tsx`
2. **Documentation**: `USAGE_GUIDE.md`, `docs/PRESENTASI-AI-USE-CASES.md`
3. **BMad output artifacts**: `_bmad-output/prd/`, `_bmad-output/planning-artifacts/`, `_bmad-output/analysis/`
4. **Reports**: Footer text "Verified by IndoRCM Pro" and "Dicetak otomatis oleh IndoRCM Pro v1.0"

The project directory itself is named `indorcm-icofr-lifecycle-platform` but renaming the directory is out of scope (it's a filesystem concern, not an application concern).

## Goals / Non-Goals

**Goals:**
- Replace all user-facing instances of "IndoRCM Pro" / "Indo RCM Pro" with "ISB Risk Pro"
- Replace code-level references (comments, constants, stat labels) that reference the old brand
- Update documentation files that are actively maintained
- Ensure zero visual regressions beyond the name change itself

**Non-Goals:**
- Renaming the project directory (`indorcm-icofr-lifecycle-platform`)
- Renaming git remote or repository name
- Changing any business logic, features, or behavior
- Updating third-party configurations or external service registrations
- Renaming the `astra-icofr-*` package name in `package.json` (internal identifier, not user-facing)

## Decisions

### Decision 1: Direct string replacement (no abstraction layer)

**Approach**: Find-and-replace all hardcoded brand strings directly in source files and documentation.

**Rationale**: The brand name is used purely as display text — there is no centralized `APP_NAME` constant. Introducing one would be scope creep for a rebrand. A direct replacement is lowest-risk and fastest.

**Alternatives considered**:
- *Centralized constant*: Would be cleaner long-term but adds an unnecessary refactor during a rebrand sprint.
- *i18n localization*: Overkill for a single-language app; adds complexity without benefit.

### Decision 2: Scope limited to source + active docs

**Approach**: Update files under `src/`, root-level documentation (`USAGE_GUIDE.md`, `README.md`), and `docs/`. Leave `_bmad-output/` (historical BMad workflow artifacts) untouched as they are generated records, not user-facing content.

**Rationale**: `_bmad-output/` files are audit trails from planning sessions. Changing them would alter historical records. They are not served to users.

### Decision 3: Version string bump

**Approach**: Where "v1.0" appears alongside the brand name (e.g., report footers), update to "v2.0" to reflect the rebrand milestone.

**Rationale**: Signals a new product identity. If the team prefers a different version strategy, this is easily adjustable.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Missed occurrence in an obscure file | Run a comprehensive grep for all variants (`IndoRCM`, `Indo RCM`, `indorcm`, `indo-rcm`) in `src/` and `docs/` before committing |
| Snapshot or E2E tests hardcode the old name | If tests exist, they will fail — this is desirable as it flags what needs updating |
| `_bmad-output/` files left with old name | Intentional — these are historical artifacts. Can be regenerated if needed. |
| User confusion during transition | No mitigation needed — this is a front-end-only rename; no data migration required |

## Migration Plan

1. Implement all string replacements in a single commit
2. Run `vite build` to confirm no compile errors
3. Visually verify key pages (Login, Home, Welcome, Reports)
4. Commit with message: `chore: rebrand from IndoRCM Pro to ISB Risk Pro`

**Rollback**: Revert the single commit. No database or data changes involved.

## Open Questions

- Should the report footer version be bumped to v2.0 or kept at v1.0? (Design assumes v2.0)
- Are there any external branding assets (logos, favicons) that contain the old name? None were found in the codebase scan, but the team should verify manually.
