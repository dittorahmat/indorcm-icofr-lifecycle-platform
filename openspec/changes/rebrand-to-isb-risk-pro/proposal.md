## Why

The application currently carries the "IndoRCM Pro" brand name throughout the codebase, UI, and documentation. The business has decided to rebrand to "ISB Risk Pro" to better reflect the company's identity and market positioning. This change ensures consistent branding across all user-facing and internal artifacts.

## What Changes

- All user-visible references to "IndoRCM Pro" and "Indo RCM Pro" will be replaced with "ISB Risk Pro"
- Application title, metadata, and document references will be updated
- Internal constants, configuration, and code comments referencing the old name will be updated
- Assets and branding files (if any) will be renamed or replaced
- No functional or behavioral changes — this is a naming/branding update only

## Capabilities

### New Capabilities
<!-- No new capabilities — this is a rebranding effort only -->

### Modified Capabilities
<!-- No existing spec-level requirement changes — this is purely a naming update -->

## Impact

- **UI Components**: All React/Vue components displaying the application name
- **Metadata**: `index.html`, `package.json`, document titles, OG tags
- **Configuration**: Environment variables, constants, theme files
- **Documentation**: README, GEMINI.md, and any user-facing docs
- **Database/Backend**: Any stored references to the application name (if applicable)
- **Tests**: Snapshot tests and assertions checking for the old name
- **Assets**: Logos, favicons, or branding images (if they contain the old name)
