import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScopingPage } from '../ScopingPage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScopingPage, useScopingEditor } from '../hooks/useScopingPage';

// Mock react-i18next
import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
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
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
  useQuery: () => ({
    data: { role: 'Lini 2' },
  }),
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

  beforeEach(() => {
    vi.clearAllMocks();

    (useScopingPage as any).mockReturnValue({
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
      },
    });

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
    (useIsMobile as any).mockReturnValue(true);

    render(<ScopingPage />);

    // On mobile, parameters card should NOT be in the document initially
    expect(screen.queryByTestId('materiality-params-card')).toBeNull();

    // The collapsed trigger button or header button should be visible
    expect(screen.getAllByRole('button', { name: /Show Parameters/i }).length).toBeGreaterThan(0);

    // ScopingEditorContent (GL Data Grid container) is immediately visible
    expect(screen.getByTestId('scoping-editor-content')).toBeDefined();
  });

  it('expands materiality parameters by default on desktop viewport', () => {
    (useIsMobile as any).mockReturnValue(false);

    render(<ScopingPage />);

    // On desktop, parameters card SHOULD be open by default
    expect(screen.getByTestId('materiality-params-card')).toBeDefined();
    expect(screen.getByTestId('scoping-editor-content')).toBeDefined();
  });

  it('allows expanding and collapsing parameters on mobile viewport', () => {
    (useIsMobile as any).mockReturnValue(true);

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
});
