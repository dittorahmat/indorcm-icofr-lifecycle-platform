import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteErrorBoundary } from '../RouteErrorBoundary';

const mockUseRouteError = vi.fn();
vi.mock('react-router-dom', () => ({
  useRouteError: () => mockUseRouteError(),
  isRouteErrorResponse: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/errorReporter', () => ({
  errorReporter: {
    report: vi.fn(),
  },
}));

describe('RouteErrorBoundary', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  it('renders standard unexpected error fallback for generic errors', () => {
    mockUseRouteError.mockReturnValue(new Error('Cannot read properties of null'));

    render(<RouteErrorBoundary />);

    expect(screen.getByText('Unexpected Error')).toBeDefined();
    expect(screen.getByText('Routing error detected')).toBeDefined();
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
  });

  it('renders update-aware fallback with reload button when chunk load failure occurs', () => {
    const reloadMock = vi.fn();
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      reload: reloadMock,
      href: 'https://icofr.dsintegra.co.id/deficiencies',
    } as any;

    sessionStorage.setItem('icofr_chunk_reload_/deficiencies', '1');

    mockUseRouteError.mockReturnValue(
      new Error('Failed to fetch dynamically imported module: https://icofr.dsintegra.co.id/assets/DeficiencyBoard-abc.js')
    );

    render(<RouteErrorBoundary />);

    expect(screen.getByText('Application Update or Connection Interrupted')).toBeDefined();
    expect(screen.getByText('Asset update detected')).toBeDefined();
    
    const reloadButton = screen.getByRole('button', { name: /reload application/i });
    expect(reloadButton).toBeDefined();

    fireEvent.click(reloadButton);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('icofr_chunk_reload_/deficiencies')).toBeNull();
  });
});
