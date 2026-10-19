import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScopingPage } from '../ScopingPage';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScopingPage, useScopingEditor } from '../hooks/useScopingPage';

// Mock react-i18next
import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

/** `/api/user/me` answer for the page's single `useQuery` (the rollover gate). */
const authMe = vi.hoisted(() => ({ role: 'Lini 2' as string | undefined }));

/** React Query doubles: stable across renders, so effects keyed on them do not loop. */
const rqStub = vi.hoisted(() => ({
  queryClient: { invalidateQueries: (): void => undefined },
  mutation: {
    mutate: (): void => undefined,
    mutateAsync: (): Promise<void> => Promise.resolve(),
    isPending: false,
  },
}));

// Mock hooks
vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(),
}));

vi.mock('../hooks/useScopingPage', () => ({
  useScopingPage: vi.fn(),
  useScopingEditor: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  // Stable identities: a fresh object per render makes any `[data]`/`[client]`
  // effect re-run forever (the empty-year view mounts SetBenchmarkModal, which
  // syncs its selection into state from the query answer).
  useQueryClient: () => rqStub.queryClient,
  useQuery: (options: { queryKey?: readonly unknown[] }) =>
    options?.queryKey?.[0] === 'auth-me' ? { data: { role: authMe.role } } : { data: undefined },
  useMutation: () => rqStub.mutation,
}));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, children }: any) => (
    <div>
      <div>{title}</div>
      {children}
    </div>
  ),
}));

vi.mock('../components/MaterialityParamsCard', () => ({
  MaterialityParamsCard: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="materiality-params-card">
      <button onClick={onClose} aria-label="Close parameters">Close</button>
    </div>
  ),
}));

vi.mock('../components/ScopingEditorContent', () => ({
  ScopingEditorContent: () => <div data-testid="scoping-editor-content">Scoping Editor Content</div>,
}));

vi.mock('../components/ScopingEditorHeader', () => ({
  ScopingEditorHeader: ({ isParamsOpen, onToggleParams }: any) => (
    <div data-testid="scoping-editor-header">
      <button onClick={onToggleParams}>
        {isParamsOpen ? 'Hide Parameters' : 'Show Parameters'}
      </button>
    </div>
  ),
}));

vi.mock('@/components/workflow/WorkflowPanel', () => ({
  WorkflowPanel: () => <div data-testid="workflow-panel" />,
}));

describe('ScopingPage / ScopingEditor responsive behavior', () => {
  const mockSimulation = {
    id: 'sim-1',
    name: 'Baseline 2027',
    basis: 'Laba Sebelum Pajak',
    status: 'Draft',
    workflowStatus: 'Draft',
    omPercentage: 5,
    haircutPercentage: 25,
    locationCount: 1,
    assessmentData: {},
    workflowHistory: [],
  };

  const scopingPageState = (overrides: Record<string, unknown> = {}) => ({
    selectedSimId: 'sim-1',
    setSearchParams: vi.fn(),
    isCreating: false,
    setIsCreating: vi.fn(),
    benchmarkModalSnap: null,
    setBenchmarkModalSnap: vi.fn(),
    simulations: [mockSimulation],
    snapshots: [],
    activeSnapshot: null,
    isLoading: false,
    mutations: {
      save: { mutate: vi.fn(), isPending: false },
      // The empty-year render touches the whole mutation surface (snapshot grid,
      // create form, rollover prompt), so the factory stubs each one.
      setActiveSnap: { mutate: vi.fn(), isPending: false },
      createSim: { mutate: vi.fn(), isPending: false },
      rollover: { mutate: vi.fn(), isPending: false },
      deleteSim: { mutate: vi.fn(), isPending: false },
      deleteSnap: { mutate: vi.fn(), isPending: false },
      requestDeleteSim: { mutate: vi.fn(), isPending: false },
    },
    ...overrides,
  });

  /**
   * The page's mock surface, behind one cast each: `useScopingPage` returns a rich
   * object the test only partially specifies, and `useIsMobile` is a plain boolean.
   * One home for the cast keeps the file's `any` count from growing per test.
   */
  const mockScopingPage = (overrides: Record<string, unknown> = {}) =>
    (useScopingPage as any).mockReturnValue(scopingPageState(overrides));
  const mockMobile = (isMobile: boolean) => vi.mocked(useIsMobile).mockReturnValue(isMobile);

  beforeEach(() => {
    vi.clearAllMocks();
    authMe.role = 'Lini 2';

    mockScopingPage();

    (useScopingEditor as any).mockReturnValue({
      simState: mockSimulation,
      setSimState: vi.fn(),
      mergedGlData: [],
      entityHierarchy: [],
      selectedEntityCodes: [],
      setSelectedEntityCodes: vi.fn(),
      omValue: 97944.75,
      pmValue: 73458563,
      multiplier: 1,
      benchmarkValue: 1000000,
      scopingCompliance: null,
      departments: [],
      applications: [],
      localAppMappings: {},
      isLocked: false,
      mutations: {
        save: { mutate: vi.fn(), isPending: false },
      },
      handlers: {
        onAssessmentChange: vi.fn(),
        onAssignDepartments: vi.fn(),
        onAppsChange: vi.fn(),
      },
      isDirty: false,
      draftBasis: 'Laba Sebelum Pajak',
      setDraftBasis: vi.fn(),
      draftOmPercentage: 5,
      setDraftOmPercentage: vi.fn(),
      draftHaircutPercentage: 25,
      setDraftHaircutPercentage: vi.fn(),
      isStale: false,
      isRecalculating: false,
      handleRecalculate: vi.fn(),
    });
  });

  it('collapses materiality parameters by default on mobile viewport', () => {
    mockMobile(true);

    render(<ScopingPage />);

    // On mobile, parameters card should NOT be in the document initially
    expect(screen.queryByTestId('materiality-params-card')).toBeNull();

    // The collapsed trigger button or header button should be visible
    expect(screen.getAllByRole('button', { name: /Show Parameters/i }).length).toBeGreaterThan(0);

    // ScopingEditorContent (GL Data Grid container) is immediately visible
    expect(screen.getByTestId('scoping-editor-content')).toBeDefined();
  });

  it('expands materiality parameters by default on desktop viewport', () => {
    mockMobile(false);

    render(<ScopingPage />);

    // On desktop, parameters card SHOULD be open by default
    expect(screen.getByTestId('materiality-params-card')).toBeDefined();
    expect(screen.getByTestId('scoping-editor-content')).toBeDefined();
  });

  it('allows expanding and collapsing parameters on mobile viewport', () => {
    mockMobile(true);

    render(<ScopingPage />);

    expect(screen.queryByTestId('materiality-params-card')).toBeNull();

    // Click the toggle button in the header or the collapsed button
    const toggleButton = screen.getAllByRole('button', { name: /Show Parameters/i })[0];
    fireEvent.click(toggleButton);

    // Now parameters card is open
    expect(screen.getByTestId('materiality-params-card')).toBeDefined();

    // Click close in the card
    fireEvent.click(screen.getByLabelText('Close parameters'));
    expect(screen.queryByTestId('materiality-params-card')).toBeNull();
  });

  // #103: the guard admits Line 3 and Admin only, so the card must not invite a
  // role that could only collect a 403. The list view (not the editor) is the one
  // that mounts the card, hence the empty year.
  const renderEmptyYear = (role: string) => {
    mockScopingPage({ simulations: [], snapshots: [] });
    mockMobile(false);
    authMe.role = role;

    render(
      <UnsavedChangesProvider>
        <ScopingPage />
      </UnsavedChangesProvider>,
    );
  };

  it('hides the rollover card from a role the guard refuses', () => {
    renderEmptyYear('Line 1');

    expect(screen.queryByText('scoping:rollover.title')).toBeNull();
  });

  it('shows the rollover card to Line 3 on an empty year', () => {
    renderEmptyYear('Line 3');

    expect(screen.getByText('scoping:rollover.title')).toBeDefined();
  });
});
