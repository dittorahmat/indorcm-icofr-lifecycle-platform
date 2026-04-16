# Proposal: Implement Multi-Language Support (EN/ID)

## Problem

The application currently has all UI text localized to English (`localize-to-english` change). However, users (BUMN) need the ability to switch between English and Indonesia for better accessibility, while maintaining official Indonesian technical terminology from Regulation SK-5/2024.

## Proposed Solution

Introduce a formal internationalization (i18n) framework using `react-i18next`. Language preferences will be persisted in the user's profile in the database.

### Key Features:
- **i18n Infrastructure**: Setup `i18next` with `react-i18next`.
- **Locale Persistence**: Save language selection (`en` | `id`) in the `user` table.
- **Language Switcher**: Add a toggle in the sidebar footer.
- **Regulatory Consistency**: Preserve technical terms like "Asesmen Manajemen", "Log Perubahan", and "Lampiran 11" in Indonesian even in English mode.
- **Phased Migration**: Start with the Sidebar, Dashboard, and Scoping pages.

## Scope

- **In-Scope**:
    - Adding `language` field to `user` table and `better-auth` config.
    - Installing i18n dependencies.
    - Creating locale JSON files for `en` and `id`.
    - Implementing the UI for switching languages.
    - Migrating core pages (Sidebar, Dashboard, Scoping).
- **Out-of-Scope**:
    - Translating user-generated data (e.g., custom process names, comments).
    - Translating full PDF documentation contents.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Database Migration**: Adding a column to the `user` table managed by `better-auth` | Use `ALTER TABLE` in a migration or via `db.execute` if using a lightweight approach. |
| **Translation Overhead**: Maintaining two sets of keys | Group keys by module (e.g., `scoping.json`, `sidebar.json`) to keep files manageable. |
| **Performance**: Large locale files impacting load time | Use `i18next-http-backend` if files get too large, or lazy load translations. For now, bundle them. |
