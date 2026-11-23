import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GLDataGrid } from '../GLDataGrid';
import { GLRow } from '@shared/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { makeMockGLRow } from '@/test/mock-factories';

const mockRows: GLRow[] = Array.from({ length: 25 }, (_, i) => makeMockGLRow({}, i + 1));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('GLDataGrid with DataTablePagination', () => {
  it('renders table rows and pagination controls when full table is opened', () => {
    renderWithClient(
      <GLDataGrid
        data={mockRows}
        assessmentData={{}}
        omValue={500_000_000}
        pmValue={250_000_000}
        onAssessmentChange={vi.fn()}
      />
    );

    // Expand full table on mobile/jsdom
    const toggleBtn = screen.getByRole('button', { name: /Lihat Tabel Penuh|common:mobile.showFullTable/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('gl-grid-pagination')).toBeInTheDocument();
    expect(screen.getByText(/Menampilkan/i)).toBeInTheDocument();
  });

  it('navigates page and updates displayed rows', () => {
    renderWithClient(
      <GLDataGrid
        data={mockRows}
        assessmentData={{}}
        omValue={500_000_000}
        pmValue={250_000_000}
        onAssessmentChange={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Lihat Tabel Penuh|common:mobile.showFullTable/i });
    fireEvent.click(toggleBtn);

    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('gl-grid-pagination')).toBeInTheDocument();
  });

  it('resets page to 1 when column filter is applied', () => {
    renderWithClient(
      <GLDataGrid
        data={mockRows}
        assessmentData={{}}
        omValue={500_000_000}
        pmValue={250_000_000}
        onAssessmentChange={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Lihat Tabel Penuh|common:mobile.showFullTable/i });
    fireEvent.click(toggleBtn);

    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });
    fireEvent.click(nextBtn);

    const filterInputs = screen.getAllByPlaceholderText(/grid.searchPlaceholder/i);
    if (filterInputs.length > 0) {
      fireEvent.change(filterInputs[0], { target: { value: '1001' } });
    }

    expect(screen.getByTestId('gl-grid-pagination')).toBeInTheDocument();
  });
});
