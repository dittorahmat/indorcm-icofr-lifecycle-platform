# Technical Concerns & Edge Cases: IndoRCM Pro

This document outlines the identified technical debt, security risks, scalability bottlenecks, and potential issues within the IndoRCM Pro - ICOFR Lifecycle Platform codebase.

## 1. Security Risks

*   **Mock Authentication Bypass (Critical):** The system relies on the `X-Mock-Role` HTTP header and browser `localStorage` for role-based access control (RBAC). Since these can be easily modified by any user, the entire permission system (Line 1, Line 2, Line 3) is effectively bypassable.
*   **Unsanitized Mass Assignment:** Many API endpoints in `worker/user-routes.ts` use the spread operator to apply request bodies directly to entity states (e.g., `{ ...body }`). This allows malicious users to overwrite sensitive fields such as `id`, `auditTrail`, or `status` that should be read-only or system-managed.
*   **Hardcoded Identifiers:** The use of hardcoded user IDs like `'u1'` in both frontend components and backend logic undermines the integrity of the audit trail and accountability features.
*   **Lack of Server-Side Validation:** While Zod is used for CSV imports, many other `POST`/`PUT` routes lack rigorous server-side schema validation for the `bpmData` and other complex JSON structures.

## 2. Scalability Bottlenecks

*   **Fragmented Durable Object Architecture:** The system creates a dedicated Durable Object (DO) instance for *every single entity instance* (each RCM, Control, etc.). This architecture results in a massive number of cold starts and subrequests, which is both slow and potentially expensive under Cloudflare's pricing model.
*   **N+1 Performance Issue in Listing:** The `IndexedEntity.list()` implementation fetches IDs from an index and then makes a separate network call to a different DO instance for *each* ID to retrieve its state. Listing 50 controls results in 51 DO invocations, which will quickly hit execution time and subrequest limits.
*   **Inefficient Middleware Seeding:** The `api/*` middleware triggers `ensureSeed` for 13+ entities on every single request. This adds significant latency to every API call, regardless of whether the data has already been seeded.
*   **Unbounded Audit Trail Growth:** Audit trails are stored as growing arrays within the Durable Object state. Over time, these will grow indefinitely, leading to performance degradation during state serialization/deserialization and eventually hitting DO storage limits.

## 3. Technical Debt

*   **Weak Type Safety:** There is extensive use of `any`, `as any`, and `@ts-ignore` throughout the core logic (`worker/user-routes.ts`, `worker/core-utils.ts`, and `shared/types.ts`). This negates the safety benefits of TypeScript and increases the likelihood of runtime errors.
*   **Broken Seeding Logic:** In `worker/user-routes.ts`, `AggregateDeficiencyEntity` is called in the seeding middleware but is not imported. This will cause a runtime crash on any API request.
*   **Fragile Concurrency Handling:** The 4-retry limit for Compare-and-Swap (CAS) operations in `mutate()` and `save()` is a "magic number" that may prove insufficient under even moderate concurrent load, leading to frequent "Concurrent modification detected" errors.
*   **Mock Data Dependency:** The core entities are tightly coupled with mock data in `shared/mock-data.ts`, making it difficult to transition to a real production environment.

## 4. Potential Issues & Edge Cases

*   **Worker Execution Limits during Import:** The `import/rcm` endpoint processes CSV rows in a loop, creating DO instances for each. A large CSV file could easily exceed the 30-second (or lower, depending on plan) Worker execution limit.
*   **No Cross-Entity Transactional Integrity:** Operations that involve multiple entities (e.g., creating a Deficiency when a CSA fails) are not transactional. If the second operation fails, the system is left in an inconsistent state.
*   **BPM Editor State Bloat:** The BPM Editor saves large, complex JSON objects (`nodes` and `edges`) directly into the RCM entity. Without compression or limits, this could lead to very large state objects that are slow to load and save.
*   **Missing Index Cleanup:** While there are `removeFromIndex` methods, it's unclear if all deletion paths correctly clean up all associated indices and relationships, which could lead to "ghost" records in lists.
