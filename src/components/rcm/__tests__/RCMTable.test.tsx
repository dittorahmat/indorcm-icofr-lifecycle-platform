import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RCMTable, RCMColumnGroup } from '../RCMTable';

// Mock i18n
import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

describe('RCMTable Responsive Rendering', () => {
  const mockGroups: RCMColumnGroup[] = [
    {
      title: 'Identifikasi Kontrol',
      columns: [
        { id: 'code', header: 'Kode', accessorKey: 'controlCode', width: '120px' },
        { id: 'name', header: 'Nama Kontrol', accessorKey: 'mappedControlName', width: '250px' },
      ],
    },
  ];

  const mockData = [
    {
      id: 'row-1',
      mappingId: 'map-1',
      controlCode: 'TLC-REV-01',
      mappedControlName: 'Verifikasi Validasi Penjualan Bulanan',
      subProcessName: 'Pendapatan & Piutang',
      riskDescription: 'Risiko salah saji pengakuan pendapatan periode berjalan',
      controlNature: 'Automated',
      riskRating: 'High',
      isKeyControl: true,
      frequency: 'Monthly',
    },
  ];

  it('renders both desktop table structure and mobile card container', () => {
    const { container } = render(
      <RCMTable groups={mockGroups} data={mockData} />
    );

    // Desktop container should exist with hidden md:block
    const desktopTable = container.querySelector('.hidden.md\\:block');
    expect(desktopTable).not.toBeNull();

    // Mobile container should exist with md:hidden
    const mobileCards = container.querySelector('.md\\:hidden');
    expect(mobileCards).not.toBeNull();
  });

  it('displays critical compliance attributes inside the mobile card view', () => {
    render(<RCMTable groups={mockGroups} data={mockData} />);

    // Check code badge
    const codeBadges = screen.getAllByText('TLC-REV-01');
    expect(codeBadges.length).toBeGreaterThanOrEqual(1);

    // Check key control indicator
    expect(screen.getByText('Key Control')).toBeInTheDocument();

    // Check risk rating badge
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('triggers onEdit callback when clicking edit button in mobile card', () => {
    const onEditMock = vi.fn();
    render(<RCMTable groups={mockGroups} data={mockData} onEdit={onEditMock} />);

    const editBtn = screen.getByRole('button', { name: /Edit TLC-REV-01/i });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);
    expect(onEditMock).toHaveBeenCalledTimes(1);
    expect(onEditMock).toHaveBeenCalledWith(mockData[0]);
  });

  it('aligns Level 2 headers correctly (center for code/numeric/short, left for descriptive text)', () => {
    const alignmentGroups: RCMColumnGroup[] = [
      {
        title: 'Header Alignment Test',
        columns: [
          { id: 'no', header: 'No', width: '50px' },
          { id: 'control_name', header: 'Nama Kontrol', width: '250px' },
          { id: 'is_key', header: 'Key?', width: '70px' },
          { id: 'risk_desc', header: 'Deskripsi Risiko', width: '300px' },
        ],
      },
    ];

    const { container } = render(
      <RCMTable groups={alignmentGroups} data={mockData} />
    );

    const thElements = container.querySelectorAll('thead tr:nth-child(2) th');
    expect(thElements.length).toBe(4);

    // 'no' should be center-aligned and tracking-normal (width <= 60px)
    expect(thElements[0]).toHaveClass('text-center');
    expect(thElements[0]).toHaveClass('tracking-normal');

    // 'control_name' should be left-aligned and tracking-wider
    expect(thElements[1]).toHaveClass('text-left');
    expect(thElements[1]).toHaveClass('tracking-wider');

    // 'is_key' should be center-aligned
    expect(thElements[2]).toHaveClass('text-center');

    // 'risk_desc' should be left-aligned
    expect(thElements[3]).toHaveClass('text-left');
  });

  it('renders colgroup with explicit width for column sizing and minWidth on cells', () => {
    const { container } = render(
      <RCMTable groups={mockGroups} data={mockData} />
    );

    const cols = container.querySelectorAll('colgroup col');
    expect(cols.length).toBe(2);
    expect(cols[0]).toHaveStyle({ width: '120px' });
    expect(cols[1]).toHaveStyle({ width: '250px' });

    const ths = container.querySelectorAll('thead tr:nth-child(2) th');
    expect(ths[0]).toHaveStyle({ width: '120px', minWidth: '120px' });
    expect(ths[1]).toHaveStyle({ width: '250px', minWidth: '250px' });

    const tds = container.querySelectorAll('tbody tr td');
    expect(tds[0]).toHaveStyle({ width: '120px', minWidth: '120px' });
    expect(tds[1]).toHaveStyle({ width: '250px', minWidth: '250px' });
  });
});
