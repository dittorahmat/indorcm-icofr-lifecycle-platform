## Context

The AI Analytics Hub previously existed as an independent page (`AIHubPage`) with a mockup analytics dashboard. It was removed/lost during the recent UI standardization that overhauled the sidebar and header. We need to restore this hub and integrate it as a utility feature in the sidebar, following the new `AppSidebar` architecture.

## Goals / Non-Goals

**Goals:**
- Restore `AIHubPage` and the associated analytics mockup.
- Integrate the hub into the `AppSidebar` utility group (above Settings).
- Ensure integration with i18n, `UnsavedChangesGuard`, and standard UI components.
- Validate functionality with type checks and linting.

**Non-Goals:**
- Implementing real AI/ML backend logic; keeping it as a functional mockup hub.
- Deep architectural changes beyond navigation integration.

## Decisions

- **Navigation Integration**: Place the link to AI Analytics in the `AppSidebar` footer group (above `Settings`), as per the user's preference. This keeps the primary workspace clear.
- **Components**: Reuse the original `AIHubPage` and `AIAnalyticsMockup` components.
- **Security**: Maintain standard `ProtectedRoute` and `LicenseGuard` as per other pages.

## Risks / Trade-offs

- [Risk] Version conflicts after UI standardization → Mitigation: Ensure components align with current Radix UI and Tailwind v4 conventions.
- [Risk] Missing i18n keys for the new sidebar link → Mitigation: Add entries in the sidebar locale files.
