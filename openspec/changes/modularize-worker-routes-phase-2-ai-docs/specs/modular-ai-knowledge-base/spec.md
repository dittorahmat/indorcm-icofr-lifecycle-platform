## ADDED Requirements

### Requirement: Modular AI and Knowledge Base Routing
The system SHALL extract all AI Chatbot and regulatory document management (Knowledge Base) routes into a dedicated Hono sub-app to ensure technical and domain isolation.

#### Scenario: Sub-app path registration
- **WHEN** the application starts
- **THEN** the routes for AI and Documents must be accessible under their original `/api/ai` and `/api/documents` prefixes via the new sub-app.

### Requirement: Isolation of Heavy Dependencies
The system SHALL ensure that specialized libraries (Google AI, PDF processing) are only imported by the modules that require them.

#### Scenario: Dependency check
- **WHEN** reviewing `worker/user-routes.ts` imports after refactoring
- **THEN** it must not contain imports for `@google/generative-ai`, `unpdf`, or `jspdf`.
