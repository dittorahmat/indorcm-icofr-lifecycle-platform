## 1. Standardize RCM Horizontal Table Columns

- [x] 1.1 Unify column font classes in `RCMTLCPage.tsx` (`process_info`, `sub_process`, `company`, `location`, `risk_desc`, `control_ref`, `control_name`, `control_desc`, `supportingDocs`) to utilize consistent sizing (`text-xs`), color (`text-slate-700` or `text-slate-800`), font family (standard sans-serif), and weight (`font-normal`).
- [x] 1.2 Unify column font classes in `RCMELCPage.tsx` columns to match the standardized layout.
- [x] 1.3 Unify column font classes in `RCMITGCPage.tsx` columns to match the standardized layout.
- [x] 1.4 Unify column font classes in `VerificationDesignPage.tsx` columns to match the standardized layout.

## 2. Refactor Tab Content Components

- [x] 2.1 Refactor rendering elements in `TLCTabContent.tsx` (Control Ref, Name, Description text sizes and colors) to match standard definitions.
- [x] 2.2 Refactor rendering elements in `ELCTabContent.tsx` (Control Ref, Name, Description text sizes and colors) to match standard definitions.
- [x] 2.3 Refactor rendering elements in `ITGCTabContent.tsx` (Control Ref, Name, Description text sizes and colors) to match standard definitions.

## 3. Verify Layout, Localization & Build Quality

- [x] 3.1 Perform typescript compilation check (`npm run type-check`) to verify import and component definition types.
- [x] 3.2 Run lint validation (`npm run lint`) to ensure codebase style compliance.
- [x] 3.3 Verify full production bundle build (`npm run build`) runs cleanly.
