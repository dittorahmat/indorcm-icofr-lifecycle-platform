import { vi } from 'vitest';

/**
 * Shared page-level `useQuery` mock (test-only, never product code).
 *
 * Replaces the old per-test untyped `useQuery` mock plumbing that the
 * any-delta gate forbids. Pair with one `vi.hoisted` store per test file:
 *
 *   const pageState = vi.hoisted(() => ({ records: new Array<TestRow>(), processes: new Array<TestProc>() }));
 *   vi.mock('@tanstack/react-query', () =>
 *     definePageQueryMock(pageState, { recordsKey: '…', processesKey: '…' }));
 *
 * The store MUST come from `vi.hoisted`: the mock factory executes at import
 * time, before the test module body, so only hoisted state is readable there.
 * Import this module above the component import so the factory helper is
 * initialised before the mocked module loads.
 */
export interface PageQueryBackingStore {
  records: unknown[];
  processes: unknown[];
  /** Optional signed-in user for pages that also read `/api/user/me`. */
  user?: unknown;
}

export interface PageQueryKeys {
  recordsKey: string;
  processesKey: string;
}

export function resetPageQueryStore(store: PageQueryBackingStore): void {
  store.records = [];
  store.processes = [];
  store.user = undefined;
}

export function definePageQueryMock(store: PageQueryBackingStore, keys: PageQueryKeys) {
  return {
    useQuery: vi.fn((options: { queryKey: string[] }): { data: unknown; isLoading: boolean } => {
      if (options.queryKey[0] === 'currentUser') return { data: store.user, isLoading: false };
      if (options.queryKey[0] === keys.recordsKey) return { data: { items: store.records }, isLoading: false };
      if (options.queryKey[0] === keys.processesKey) return { data: { items: store.processes }, isLoading: false };
      return { data: { items: [] }, isLoading: false };
    }),
    useMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
    useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
  };
}
