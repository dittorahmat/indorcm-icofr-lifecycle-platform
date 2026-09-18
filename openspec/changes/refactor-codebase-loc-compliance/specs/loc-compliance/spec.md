## ADDED Requirements

### Requirement: Modular BPM Custom Node Architecture
The system SHALL decompose monolithic custom nodes into specialized functional sub-modules categorized under Lampiran 3 Regulation SK-5/DKU.MBU/11/2024.
- All process-related nodes (Start/End, Task, Subprocess) SHALL reside in `ProcessNodes.tsx`.
- All risk and control nodes (Risk hexagon, Control box) SHALL reside in `RiskControlNodes.tsx`.
- All system and media nodes (Database cylinder, Application) SHALL reside in `SystemMediaNodes.tsx`.
- All annotation and archive nodes (Inverted triangle archive, notes) SHALL reside in `AnnotationNodes.tsx`.
- A central barrel index file SHALL export the unified `bpmNodeTypes` registry.
- Each individual node file SHALL remain below 400 LOC.

#### Scenario: Rendering custom nodes on diagram canvas
- **WHEN** a user opens a BPM diagram with Lampiran 3 nodes
- **THEN** the canvas SHALL render each node with identical handle positions, styling, and behavior without visual disruption.

### Requirement: Modular Backend BPM Service Architecture
The system SHALL decompose `worker/services/bpm-service.ts` into isolated, single-responsibility sub-services.
- SK-5 compliance and node/edge validation logic SHALL reside in `bpm-validator.ts`.
- Diagram transformations, I/O formatting, and layout calculations SHALL reside in `bpm-transformer.ts`.
- Lampiran 6 change log tracking and audit trails SHALL reside in `bpm-audit.ts`.
- The main `bpm-service.ts` SHALL act as a facade orchestrator maintaining identical public method signatures.
- Each individual service module SHALL remain below 400 LOC.

#### Scenario: Validating and saving BPM diagram
- **WHEN** an editor saves a diagram modification
- **THEN** the facade service SHALL delegate validation, persist change records, and persist node/edge data transparently.

### Requirement: Lean Controller and Dedicated Domain Service Layer
The system SHALL separate HTTP route handlers in `worker/routes/rcm.ts` and `worker/routes/csa.ts` from database query operations.
- RCM queries, matrix building, and relational joins SHALL be encapsulated in `worker/services/rcm-service.ts`.
- CSA schedule, assessment queries, and verification workflows SHALL be encapsulated in `worker/services/csa-service.ts`.
- Route controllers SHALL only handle request schema validation, call the appropriate service, and return standardized HTTP responses.
- The route controller files SHALL remain below 400 LOC.

#### Scenario: Fetching RCM Matrix or CSA assessments
- **WHEN** a client calls `GET /api/rcm` or `GET /api/csa`
- **THEN** the route controller SHALL invoke the respective service and return results with zero API response contract changes.
