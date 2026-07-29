## ADDED Requirements

### Requirement: Tenant Configuration Provider
The system SHALL provide a `TenantProvider` that reads the active tenant configuration from `VITE_TENANT_ID` environment variable or URL query parameter `tenant`.

#### Scenario: Read Default Tenant Configuration
- **WHEN** application initializes without `VITE_TENANT_ID` or `tenant` parameter
- **THEN** system SHALL load default IndoGRC Pro configuration (`standalone`, standard theme, standard auth)

#### Scenario: Read Company B Tenant Configuration
- **WHEN** application initializes with `VITE_TENANT_ID=company_b` or `tenant=company_b`
- **THEN** system SHALL load `company_b` configuration (`isEmbedded: true`, Blazor theme tokens, JWT SSO adapter)

### Requirement: Dynamic Theme Switching
The system SHALL dynamically apply CSS variable overrides to the root document based on the active tenant configuration.

#### Scenario: Apply Theme Tokens for Company B
- **WHEN** `company_b` configuration is activated
- **THEN** system SHALL set `data-tenant="company_b"` attribute on HTML document root and apply Microsoft/Blazor color palette tokens

### Requirement: Embedded Layout Mode
The system SHALL hide top navigation and sidebar UI elements when `isEmbedded` is set to `true` in tenant configuration.

#### Scenario: Render Workspace in Embedded Mode
- **WHEN** user navigates any page with `isEmbedded: true`
- **THEN** system SHALL hide `Sidebar` and `Header` components, allowing workspace content to occupy 100% viewport width and height

### Requirement: JWT SSO Authentication Adapter
The system SHALL extract and validate JWT authentication tokens passed via URL parameter `token` or window `postMessage` event.

#### Scenario: Authenticate via Incoming JWT Token
- **WHEN** parent application passes a valid JWT token via `postMessage` or URL parameter
- **THEN** system SHALL decode user identity, populate user context, and bypass standard login screen
