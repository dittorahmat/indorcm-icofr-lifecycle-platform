/**
 * Source of Truth — barrel (backward compatible).
 * Domain types live in `shared/types/*.ts` (see `shared/types/README.md` for the lifecycle map).
 * This file re-exports them so existing `import ... from "@shared/types"` keeps working.
 * New code SHOULD import from the domain module directly.
 */
export * from './types/common';
export * from './types/org';
export * from './types/scoping';
export * from './types/rcm-bpm';
export * from './types/csa-testing';
export * from './types/deficiency';
export * from './types/user';
