# Testing Strategy - IndoGRC Pro

## Current Testing Landscape
As of the current state, IndoGRC Pro does not utilize automated testing frameworks like Vitest or Playwright. Quality assurance is primarily managed through built-in compliance logic and a specialized manual testing UI.

### 1. Manual Quality Assurance: Test Workbench
The primary tool for verifying control effectiveness is the **Test Workbench** (`src/pages/testing/TestWorkbench.tsx`). It provides:
- **Test of Design (TOD):** Checklist-based design evaluation.
- **Test of Effectiveness (TOE):** Sampling-based operational testing.
- **IPE/EUC Validation:** Specialized checks for Information Produced by Entity and End-User Computing controls (Tables 14, 15, and 20 of SK-5).
- **Remediation Readiness:** Automated checks based on Table 23 (Minimum wait times before testing a remediated control).
- **Cooling-Off Period Check:** (Bab II poin d.2) Verification that the auditor (Line 3) hasn't previously been a process owner (Line 1/2) within 12 months.

### 2. Compliance-Driven Testing Logic
Regulatory requirements are baked into the `src/lib/compliance-utils.ts` module, which is used across the frontend to guide manual testing:
- **Risk Rating Calculation:** Matrix-based 3x3 rating (Tabel 12).
- **Sample Selection Guide:** Table 22-compliant sample size recommendations based on Frequency, Risk Rating, and Nature.
- **Remediation Sample Size:** Table 23-compliant sample sizes for remediation tests.
- **Benford's Law Analysis:** Statistical validation of population data for anomalies.
- **COBIT 2019 Mapping:** ITGC control area mapping based on Table 1.

### 3. Built-in Data Integrity
Quality is further ensured through:
- **Zod Schema Validation:** Strictly enforcing the `shared/types.ts` contract for all data ingress/egress.
- **Audit Logging:** Mandatory change tracking (Lampiran 6) for all entity mutations.
- **Role-Based Access Control (RBAC):** Built-in validation of Line 1, 2, and 3 responsibilities to ensure segregation of duties (SoD).

## Recommended Testing Roadmap

### Phase 1: Unit & Integration Testing (Short-term)
- **Framework:** Vitest (with `bun test` compatibility).
- **Priority Areas:**
  - `src/lib/compliance-utils.ts`: Exhaustive unit tests for all SK-5 formulas (Sampling, Remediation, Materiality).
  - `shared/types.ts`: Validation tests for Zod schemas.
  - `worker/core-utils.ts`: Testing server-side utilities and Durable Object logic.

### Phase 2: End-to-End (E2E) Testing (Mid-term)
- **Framework:** Playwright.
- **Critical Workflows:**
  - **Scoping & Materiality:** Calculation flow from Assets/Revenue to Account Scoping.
  - **CSA Cycle:** Assessment submission by Lini 1 -> Validation by Lini 2 -> Review by Lini 3.
  - **Deficiency Management:** Lifecycle of a deficiency from identification to remediation verification.

### Phase 3: Performance & Load Testing (Long-term)
- **Tool:** k6 or Wrangler's built-in performance tools.
- **Focus:** Testing Cloudflare Worker limits and Durable Object concurrency during period-end closing spikes.

## How to Verify Quality (Manual)
1. **Linting:** `bun run lint` (Checks for standard and custom regulatory-safety ESLint rules).
2. **Type-Checking:** `bun x tsc --noEmit` (Ensures full project type-safety).
3. **Workbench:** Log in as Line 3 (Auditor) and use the `/testing` route to perform control validations against SK-5 requirements.
