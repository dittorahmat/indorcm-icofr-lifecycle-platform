import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DoDTable } from '../DoDTable';
import type { FormattedDoDRow } from '../dod-types';

const mockRows: FormattedDoDRow[] = Array.from({ length: 25 }, (_, i) => ({
  ref: `DEF-${i + 1}`,
  description: `Deficiency Description ${i + 1}`,
  isRemediated: false,
  ineffectivePeriod: 'Q4 2026',
  exposureValue: 50_000_000,
  severity: 'ICD',
  impactedAccount: '100100',
  cosoComponent: 'Control Activities',
  businessProcess: 'Procurement',
  businessUnit: 'Head Office',
  assertions: {
    completeness: false,
    existence: false,
    accuracy: false,
    valuation: false,
    rightsAndObligations: false,
    presentation: false,
    cutoff: false,
  },
  boxes: {
    box1: false,
    box2: false,
    box3: false,
    box4: false,
    box5: false,
    box6: false,
    box7: false,
  },
}));

describe('DoDTable with DataTablePagination', () => {
  it('renders rows with pagination controls and slices to 10 items by default', () => {
    render(<DoDTable rows={mockRows} showFullTable={true} />);

    expect(screen.getByTestId('dod-table-pagination')).toBeInTheDocument();
    expect(screen.getByText('DEF-1')).toBeInTheDocument();
    expect(screen.getByText('DEF-10')).toBeInTheDocument();
    expect(screen.queryByText('DEF-11')).not.toBeInTheDocument();
    expect(screen.getByText(/Menampilkan 1-10 dari 25 data/i)).toBeInTheDocument();
  });

  it('navigates to next page on clicking next button', () => {
    render(<DoDTable rows={mockRows} showFullTable={true} />);

    const nextBtn = screen.getByRole('button', { name: /halaman berikutnya/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('DEF-11')).toBeInTheDocument();
    expect(screen.queryByText('DEF-1')).not.toBeInTheDocument();
    expect(screen.getByText(/Menampilkan 11-20 dari 25 data/i)).toBeInTheDocument();
  });
});
