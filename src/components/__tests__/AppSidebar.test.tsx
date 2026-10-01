import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppSidebar } from '../app-sidebar';
import { MemoryRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: { user: { role: 'Admin', language: 'id' } } }),
    signOut: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined }),
}));

vi.mock('@/store/useFiscalYearStore', () => ({
  useFiscalYearStore: () => ({ workingYear: '2026' }),
}));

vi.mock('@/context/ai-chat-store', () => ({
  useAIChatStore: () => ({ toggleChat: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'groups.mainTasks': 'Pekerjaan Utama',
        'groups.reportingRcm': 'Pelaporan & RCM',
        'groups.testing': 'Pengujian',
        'groups.others': 'Lainnya',
        'items.dashboard': 'Dashboard',
        'items.scoping': 'Penentuan Akun Signifikan',
        'items.bpm': 'BPM & CSA',
        'items.csaReports': 'Laporan CSA & Proses TOE',
        'items.verificationDesign': 'TOD / Verifikasi Rancangan',
        'items.applications': 'Inventory Aplikasi',
        'items.rcmElc': 'Matriks RCM ELC',
        'items.rcmTlc': 'Matriks RCM TLC',
        'items.rcmItgc': 'Matriks RCM ITGC',
        'items.wbs': 'Rekap WBS',
        'items.app10': 'Lampiran 10 (Kertas Kerja DoD)',
        'items.app11': 'Lampiran 11 (Asesmen Manajemen)',
        'items.deficiencies': 'Defisiensi & Remediasi',
      };
      return translations[key] || key;
    },
    i18n: { language: 'id', changeLanguage: vi.fn() },
  }),
}));

describe('AppSidebar Navigation with Appendix 10', () => {
  it('renders Lampiran 10 link strictly between WBS and Lampiran 11 with fiscal year param', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    );

    const app10Link = screen.getByRole('link', { name: /Lampiran 10 \(Kertas Kerja DoD\)/i });
    expect(app10Link).toBeInTheDocument();
    expect(app10Link).toHaveAttribute('href', '/reports/appendix-10?year=2026');

    // Verify ordering in DOM: wbs before app10, and app10 before app11
    const wbsLink = screen.getByRole('link', { name: /Rekap WBS/i });
    const app11Link = screen.getByRole('link', { name: /Lampiran 11 \(Asesmen Manajemen\)/i });

    expect(wbsLink.compareDocumentPosition(app10Link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(app10Link.compareDocumentPosition(app11Link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
