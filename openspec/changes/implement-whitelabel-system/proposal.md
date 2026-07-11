## Why

Implement a secure, offline-first whitelabeling architecture and upgraded licensing system for IndoGRC Pro. This allows whitelabel partners (such as `dsintegra`) to safely customize, extend, and deploy the application (adjusting logos, app names, styles, and custom routes) under their own brand, while protecting core proprietary intellectual property and licensing enforcement logic through strict codebase boundaries, offline double-signing cryptography, and automated release pipeline obfuscation.

## What Changes

- **Hybrid Offline Double-Signing:** Upgraded the license verification engine to dynamically support and enforce:
  - **Direct Sales:** 2-part keys (`[Payload].[Developer Signature]`) verifying only your root signature.
  - **Whitelabel Sales:** 3-part keys (`[Payload].[Partner Signature].[Developer Signature]`) verifying both the partner's signature and your developer approval signature offline using a hardcoded `DEVELOPER_PUBLIC_KEY`.
- **Extension Registry Pattern:** Implemented standardized extensibility hooks:
  - **Frontend:** Dynamic route mapping and sidebar menu injection from the `/src/extensions` folder.
  - **Backend:** Dynamic route mounting for Hono Worker sub-apps in `/worker/extensions`.
- **Release Obfuscation Script:** Added a release automation script (`scripts/release-whitelabel.ts`) that compiles core modules to JS, runs obfuscation, and packages them with type definitions.
- **CI/CD Pipeline integration:** Integrated automated compilation, obfuscation, and deployment workflows via GitHub Actions targeting the new `dsintegra/grc-platform-whitelabel` repository.

## Capabilities

### New Capabilities
- `whitelabel-extensions`: Extensibility layer for isolated partner-specific UI pages, sidebar menus, and API routes.

### Modified Capabilities
- `system-licensing`: Upgraded to support offline Double-Signing validation for whitelabel partners, maintaining backward-compatibility with direct-sales single-signing.

## Impact

- **Backend (`worker/`):**
  - `worker/lib/license.ts`: Verifier logic upgraded to inspect and verify double-signature keys.
  - `worker/app.ts`: Injects the backend extension router registry.
  - `worker/extensions/`: Entry point folder created for partner APIs.
- **Frontend (`src/`):**
  - `src/main.tsx`: Upgraded to map and inject routes from `src/extensions/index.ts` dynamically.
  - `src/components/layout/Sidebar.tsx`: Sidebar updated to read and draw menu items from the active extensions array.
  - `src/extensions/`: Entry point folder created for partner-specific files.
- **Release Automation:**
  - `scripts/release-whitelabel.ts`: Utility script created to automate the splitting, obfuscation, and target folder generation for the whitelabel release.
