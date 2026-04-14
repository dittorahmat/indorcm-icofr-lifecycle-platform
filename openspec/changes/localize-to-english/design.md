## Context

The application currently mixes Indonesian and English text across its user interface. This includes labels, headings, button text, form fields, navigation items, error/success messages, table headers, modal titles, tooltips, and documentation. An audit identified approximately 900+ instances of Indonesian text across ~26 files.

The codebase is a React/TypeScript application using:
- **Drizzle ORM** for database schemas (with Indonesian column comments)
- **React components** with hardcoded string literals (no i18n framework)
- **Markdown documentation** files with Indonesian headings

There is currently no internationalization (i18n) infrastructure — strings are hardcoded directly in components.

## Goals / Non-Goals

**Goals:**
- Standardize ALL user-facing text to English
- Create a consistent terminology glossary for the application
- Establish a pattern for future text additions (always English)
- Update database schema comments to English
- Update documentation headings to English
- Maintain existing functionality — only text changes

**Non-Goals:**
- Building a full i18n/multi-language system (out of scope)
- Changing business logic or data models
- Modifying API contracts or data structures
- Changing database column names (only comments/documentation)

## Decisions

### Decision 1: Direct string replacement vs. i18n framework

**Choice**: Direct string replacement in-place (no i18n framework introduction).

**Rationale**: The application is single-language (English-only). Introducing an i18n framework (react-i18next, etc.) adds complexity without immediate benefit. Direct replacement is simpler, faster, and achieves the goal.

**Alternatives considered**:
- Introduce react-i18next with English JSON files: adds dependency and migration overhead for single-language use case
- Create a constants file for all strings: improves consistency but still hardcoded; can be a future improvement

### Decision 2: Translation approach

**Choice**: Use context-appropriate English translations that match the application's domain (financial/lifecycle management platform).

**Rationale**: Literal translations may not match the domain terminology. Terms like "Laporan" should become "Reports" (not "Report Card"), "Pengaturan" should become "Settings", etc.

**Guidelines**:
- Use standard SaaS/enterprise terminology
- Maintain consistency: same concept → same English term everywhere
- Title case for headings and labels; sentence case for messages and descriptions

### Decision 3: Database comments

**Choice**: Update Drizzle schema comments from Indonesian to English.

**Rationale**: Database comments are developer-facing documentation. English ensures consistency with the rest of the codebase and is more accessible to international team members.

### Decision 4: Documentation files

**Choice**: Translate markdown headings and section titles to English. Content (code blocks, technical details) remains unchanged.

**Rationale**: Documentation should be accessible to all team members regardless of language proficiency.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Translation inconsistency**: Different translators might use different terms for the same concept | Create a terminology glossary in the design doc; review all changes in a single PR for consistency |
| **Missed instances**: Some Indonesian text might be overlooked | Use comprehensive grep/search patterns; audit all UI surfaces before merging |
| **Context mismatch**: Direct translation might not fit the UI context | Review each change in context of its component; adjust for space/layout constraints |
| **Regression in functionality**: Accidental changes to logic while updating strings | Keep changes purely textual — only modify string literals, not code logic |
| **Large PR scope**: 900+ changes across 26 files is a large diff | Group changes by module/feature area; consider sequential PRs if too large |

## Migration Plan

1. **Phase 1**: Core UI components (navigation, sidebar, headers, buttons)
2. **Phase 2**: Forms, tables, modals, and data entry screens
3. **Phase 3**: Error/success messages, validation, tooltips
4. **Phase 4**: Database schema comments and documentation
5. **Phase 5**: Final audit — search for any remaining Indonesian text

Each phase should be reviewable independently. No database migrations or API changes are required.

**Rollback**: Since this is purely textual, rollback is a simple `git revert`. No data migration needed.

## Open Questions

- Should we introduce a string constants file (e.g., `src/constants/labels.ts`) to centralize all UI text for easier future changes? (Recommended for future improvement, not in this change)
- Are there any regulatory/compliance labels that MUST remain in Indonesian? (Assume no unless flagged by domain expert)
