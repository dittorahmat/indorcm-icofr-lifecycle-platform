import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { RCMExplorerHeaderBanner } from '../RCMExplorerHeaderBanner';

describe('RCMExplorerHeaderBanner', () => {
  it('renders Light Sovereign card with mandate badges, headline, metrics pill, and 11 BUMN clusters', () => {
    const handleSelectCluster = vi.fn();

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <RCMExplorerHeaderBanner
          workingYear="2024"
          activeCluster="ALL"
          onSelectCluster={handleSelectCluster}
          totalKeyControls={24}
          totalControls={80}
        />
      </I18nextProvider>
    );

    // Verify mandate and metadata badges
    expect(screen.getByText(/Mandat SK-5 \/ BPKP-2024/i)).toBeInTheDocument();
    expect(screen.getByText(/SK-5\/DKU\.MBU\/11\/2024 Lampiran 2 & 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Tahun Buku 2024/i)).toBeInTheDocument();

    // Verify headline & subtitle
    expect(
      screen.getByText(/Risk & Control Matrix \(RCM\) Key Control Explorer/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Repositori pengendalian kunci BUMN berlandaskan standar 11 klaster/i)
    ).toBeInTheDocument();

    // Verify metrics pill
    expect(screen.getByText(/Rasio Key Control/i)).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText(/\/ 80 Kontrol/i)).toBeInTheDocument();
    expect(screen.getByText(/30% Prioritas/i)).toBeInTheDocument();
    expect(screen.getByText(/Mandatori Pengujian/i)).toBeInTheDocument();

    // Verify Light Sovereign styling classes on container
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('bg-white');
    expect(rootDiv.className).toContain('dark:bg-card');
    expect(rootDiv.className).toContain('text-foreground');
    expect(rootDiv.className).toContain('border-border/80');

    // Anti-slop: dark containers and glow circles removed
    expect(rootDiv.className).not.toContain('bg-primary-container');
    const html = container.innerHTML;
    expect(html).not.toContain('bg-primary-container');
    expect(html).not.toContain('blur-3xl');
    expect(html).not.toContain('blur-2xl');
    expect(html).not.toContain('text-[8px]');
    expect(html).not.toContain('text-[9px]');
    expect(html).not.toContain('text-[10px]');
    expect(html).not.toContain('text-[11px]');

    // Verify cluster selector chips
    expect(screen.getByText('Semua Klaster')).toBeInTheDocument();
    const clusterScrollContainer = screen.getByText('Semua Klaster').parentElement;
    expect(clusterScrollContainer?.className).toContain('overflow-x-auto');
    expect(clusterScrollContainer?.className).toContain('touch-pan-x');

    const energiChip = screen.getByTitle('Industri Energi & Migas');
    expect(energiChip).toBeInTheDocument();

    // Test clicking a cluster chip
    fireEvent.click(energiChip);
    expect(handleSelectCluster).toHaveBeenCalledWith('Industri Energi');
  });

  it('renders active cluster state correctly and handles 0 controls safely', () => {
    const handleSelectCluster = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <RCMExplorerHeaderBanner
          workingYear="2025"
          activeCluster="Jasa Logistik"
          onSelectCluster={handleSelectCluster}
          totalKeyControls={0}
          totalControls={0}
        />
      </I18nextProvider>
    );

    // Verify 0% ratio fallback without NaN
    expect(screen.getByText(/0% Prioritas/i)).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/\/ 0 Kontrol/i)).toBeInTheDocument();
    expect(screen.getByText(/Tahun Buku 2025/i)).toBeInTheDocument();

    // Verify clicking All Clusters
    const allChip = screen.getByText('Semua Klaster');
    fireEvent.click(allChip);
    expect(handleSelectCluster).toHaveBeenCalledWith('ALL');
  });
});
