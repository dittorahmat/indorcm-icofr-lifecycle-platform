# Design: Multi-Language Support (i18n)

## Context

The IndoGRC Pro platform targets BUMN in Indonesia, but is currently localized only to English. We need to introduce an i18n system that allows switching to Indonesian while preserving specific technical terms from Regulation SK-5/2024.

## Technical Strategy

### 1. Framework Choice: `react-i18next`

We will use the industry-standard `i18next` and `react-i18next` libraries.
- `i18next`: The core translation engine.
- `react-i18next`: React bindings for hooks like `useTranslation`.
- `i18next-browser-languagedetector`: Detects browser language as a fallback.

### 2. State & Persistence

Instead of local storage, the language preference will be stored in the `user` table in Postgres (`language` column).

**Data Flow**:
1. User logs in → `better-auth` returns user profile including `language`.
2. `AppSidebar` initializes `i18n.changeLanguage(user.language)`.
3. User toggles language in Sidebar → Call `PUT /api/auth/profile` with new language.
4. On success, `i18n.changeLanguage()` is called and React components re-render.

### 3. Locale Structure

Locales will be organized into JSON files under `src/i18n/locales/<lang>/`.

**Example: `src/i18n/locales/en/common.json`**
```json
{
  "actions": {
    "add": "Add",
    "save": "Save",
    "delete": "Delete"
  },
  "regulatory": {
    "app11": "Lampiran 11",
    "cm_log": "Log Perubahan (Appendix 6)",
    "rcm": "Risk Control Matrices (RCM)"
  }
}
```

**Note on Technical Terms**: Terms like "Log Perubahan" will be used in both English and Indonesian locales where the regulation requires precise naming.

## Changes Required

### Backend
1.  **Drizzle Schema**: Add `language` column to `user` table.
2.  **Auth Config**: Add `language` to `additionalFields` in `better-auth`.
3.  **API Routes**: Add profile update endpoint in `user-routes.ts`.

### Frontend
1.  **Dependencies**: Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
2.  **Config**: Create `src/i18n/config.ts`.
3.  **AppRoot**: Wrap main entry with `Suspense` and ensure `i18n` is initialized.
4.  **UI Components**:
    - `LanguageSwitcher`: Dropdown or toggle in `AppSidebar`.
    - Update `AppSidebar.tsx` to use keys.
    - Update `ScopingPage.tsx` and `Dashboard.tsx`.

## Data Mapping (Regulation SK-5)

| English UI | Indonesian UI | Key |
|---|---|---|
| Dashboard | Dashboard | `sidebar.dashboard` |
| Significant Account Identification | Penentuan Akun Signifikan | `sidebar.scoping` |
| Appendix 11 | Lampiran 11 | `sidebar.app11` |
| Change Log | Log Perubahan | `sidebar.changelog` |
| Control Self-Assessment | CSA (Sertifikasi Mandiri) | `sidebar.csa` |
