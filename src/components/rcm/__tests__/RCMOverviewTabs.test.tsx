import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TLCTabContent } from '../TLCTabContent';
import { ELCTabContent } from '../ELCTabContent';
import { ITGCTabContent } from '../ITGCTabContent';
import { Control } from '@shared/types';
import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

describe('RCM Overview Tab Contents Table Layout & Responsiveness', () => {
  const mockTlcControls: Control[] = [
    {
      id: 'tlc-1',
      organizationId: 'org-1',
      code: 'TLC-REV-01',
      name: 'Verifikasi Validasi Penjualan Bulanan',
      description: 'Pengecekan konsistensi transaksi pendapatan dengan invoice dan faktur pajak',
      level: 'TLC',
      nature: 'Automated',
      riskRating: 'High',
      relatedControlIds: ['elc-1'],
      rcmId: 'rcm-1',
      type: 'Preventive',
      frequency: 'Monthly',
      bpmStatus: 'Active',
      effectiveDate: null,
      lastCsaDate: null,
      assertions: [],
      ipos: [],
      cosoPrinciples: [],
    } as Control,
  ];

  const mockElcControls: Control[] = [
    {
      id: 'elc-1',
      organizationId: 'org-1',
      code: 'ELC-ETH-01',
      name: 'Penegakan Kode Etik dan Integritas',
      description: 'Penerapan pakta integritas dan sosialisasi berkala untuk seluruh insan BUMN',
      level: 'ELC',
      nature: 'Manual',
      riskRating: 'Medium',
      cosoPrinciples: [1],
      frequency: 'Annual',
      rcmId: 'rcm-elc-1',
      type: 'Preventive',
      bpmStatus: 'Active',
      effectiveDate: null,
      lastCsaDate: null,
      assertions: [],
      ipos: [],
      relatedControlIds: [],
    } as Control,
  ];

  const mockItgcControls: Control[] = [
    {
      id: 'itgc-1',
      organizationId: 'org-1',
      code: 'ITGC-AC-01',
      name: 'Manajemen Hak Akses Pengguna User Access Review',
      description: 'Review hak akses sistem informasi finansial secara berkala oleh System Owner',
      level: 'ITGC',
      nature: 'Automated',
      riskRating: 'High',
      itgcDomain: 'Access to Programs and Data',
      automatedSubNature: 'Automated',
      itApplication: 'SAP S/4HANA',
      rcmId: 'rcm-itgc-1',
      type: 'Detective',
      frequency: 'Quarterly',
      bpmStatus: 'Active',
      effectiveDate: null,
      lastCsaDate: null,
      assertions: [],
      ipos: [],
      cosoPrinciples: [],
      relatedControlIds: [],
    } as Control,
  ];

  describe('TLCTabContent', () => {
    it('renders desktop table with min-w-[960px] and properly sized columns', () => {
      const { container } = render(
        <BrowserRouter>
          <TLCTabContent
            filteredTlc={mockTlcControls}
            controlsLoading={false}
            searchTerm=""
            onSearchChange={vi.fn()}
            onEditControl={vi.fn()}
          />
        </BrowserRouter>
      );

      const table = container.querySelector('table');
      expect(table).toHaveClass('min-w-[960px]');

      const tableWrapper = container.querySelector('.hidden.md\\:block');
      expect(tableWrapper).toHaveClass('overflow-x-auto', 'max-w-full', 'touch-pan-x', 'overscroll-x-contain');

      const headers = container.querySelectorAll('thead th');
      expect(headers[0]).toHaveClass('w-[140px]');
      expect(headers[1]).toHaveClass('min-w-[280px]');
      expect(headers[2]).toHaveClass('w-[130px]');
      expect(headers[3]).toHaveClass('w-[130px]', 'text-center');
      expect(headers[4]).toHaveClass('w-[160px]', 'text-center');
      expect(headers[5]).toHaveClass('w-[60px]', 'text-right');
    });

    it('renders mobile card view for small viewports', () => {
      const { container } = render(
        <BrowserRouter>
          <TLCTabContent
            filteredTlc={mockTlcControls}
            controlsLoading={false}
            searchTerm=""
            onSearchChange={vi.fn()}
            onEditControl={vi.fn()}
          />
        </BrowserRouter>
      );

      const mobileContainer = container.querySelector('.md\\:hidden');
      expect(mobileContainer).not.toBeNull();
      expect(screen.getAllByText('TLC-REV-01').length).toBeGreaterThanOrEqual(1);
    });

    it('renders semantic primary tokens on Open TLC Matrix button and handles loading state without pending text', () => {
      const { rerender } = render(
        <BrowserRouter>
          <TLCTabContent
            filteredTlc={mockTlcControls}
            controlsLoading={false}
            searchTerm=""
            onSearchChange={vi.fn()}
            onEditControl={vi.fn()}
          />
        </BrowserRouter>
      );

      const openButton = screen.getByRole('button', { name: /matrix\.open_matrix_tlc/i });
      expect(openButton).toHaveClass('bg-primary', 'text-primary-foreground');

      rerender(
        <BrowserRouter>
          <TLCTabContent
            filteredTlc={[]}
            controlsLoading={true}
            searchTerm=""
            onSearchChange={vi.fn()}
            onEditControl={vi.fn()}
          />
        </BrowserRouter>
      );

      expect(screen.queryByText(/pending/i)).toBeNull();
      expect(screen.getAllByText('common:status.loading').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ELCTabContent', () => {
    it('renders desktop table with min-w-[960px] and balanced columns', () => {
      const { container } = render(
        <BrowserRouter>
          <ELCTabContent
            elcControls={mockElcControls}
            onEditControl={vi.fn()}
            onCreateControl={vi.fn()}
          />
        </BrowserRouter>
      );

      const table = container.querySelector('table');
      expect(table).toHaveClass('min-w-[960px]');

      const tableWrapper = container.querySelector('.hidden.md\\:block');
      expect(tableWrapper).toHaveClass('overflow-x-auto', 'max-w-full', 'touch-pan-x', 'overscroll-x-contain');

      const headers = container.querySelectorAll('thead th');
      expect(headers[0]).toHaveClass('w-[280px]');
      expect(headers[1]).toHaveClass('min-w-[340px]');
      expect(headers[2]).toHaveClass('w-[160px]', 'text-center');
      expect(headers[3]).toHaveClass('w-[60px]', 'text-right');
    });

    it('renders mobile card view for small viewports', () => {
      const { container } = render(
        <BrowserRouter>
          <ELCTabContent
            elcControls={mockElcControls}
            onEditControl={vi.fn()}
            onCreateControl={vi.fn()}
          />
        </BrowserRouter>
      );

      const mobileContainer = container.querySelector('.md\\:hidden');
      expect(mobileContainer).not.toBeNull();
      expect(screen.getAllByText('Principle 1').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ITGCTabContent', () => {
    it('renders desktop table with min-w-[960px] and spacious column allocation', () => {
      const { container } = render(
        <BrowserRouter>
          <ITGCTabContent
            filteredItgc={mockItgcControls}
            controlsLoading={false}
            searchTerm=""
            onSearchChange={vi.fn()}
            onEditControl={vi.fn()}
          />
        </BrowserRouter>
      );

      const table = container.querySelector('table');
      expect(table).toHaveClass('min-w-[960px]');

      const tableWrapper = container.querySelector('.hidden.md\\:block');
      expect(tableWrapper).toHaveClass('overflow-x-auto', 'max-w-full', 'touch-pan-x', 'overscroll-x-contain');

      const headers = container.querySelectorAll('thead th');
      expect(headers[0]).toHaveClass('w-[140px]');
      expect(headers[1]).toHaveClass('w-[130px]');
      expect(headers[2]).toHaveClass('min-w-[280px]');
      expect(headers[3]).toHaveClass('w-[150px]', 'text-center');
      expect(headers[4]).toHaveClass('w-[160px]');
      expect(headers[5]).toHaveClass('w-[60px]', 'text-right');
    });

    it('renders mobile card view for small viewports', () => {
      const { container } = render(
        <BrowserRouter>
          <ITGCTabContent
            filteredItgc={mockItgcControls}
            controlsLoading={false}
            searchTerm=""
            onSearchChange={vi.fn()}
            onEditControl={vi.fn()}
          />
        </BrowserRouter>
      );

      const mobileContainer = container.querySelector('.md\\:hidden');
      expect(mobileContainer).not.toBeNull();
      expect(screen.getAllByText('ITGC-AC-01').length).toBeGreaterThanOrEqual(1);
    });

    it('renders loading state without ambiguous pending text in ITGCTabContent', () => {
      render(
        <BrowserRouter>
          <ITGCTabContent
            filteredItgc={[]}
            controlsLoading={true}
            searchTerm=""
            onSearchChange={vi.fn()}
            onEditControl={vi.fn()}
          />
        </BrowserRouter>
      );

      expect(screen.queryByText(/pending/i)).toBeNull();
      expect(screen.getAllByText('common:status.loading').length).toBeGreaterThanOrEqual(1);
    });
  });
});
