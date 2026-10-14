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
});
