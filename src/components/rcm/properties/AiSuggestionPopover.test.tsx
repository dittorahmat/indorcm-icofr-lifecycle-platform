import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { AiSuggestionPopover, type AiSuggestionContext } from './AiSuggestionPopover';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

// cmdk Command measures layout via ResizeObserver (absent in jsdom)
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

const mockedApi = vi.mocked(api);

const CONTEXT: AiSuggestionContext = {
  glCode: '10008-000318',
  glDesc: 'Setoran Tunai',
  bpmName: 'Setoran di Teller',
  nodeLabel: 'menerima uang dari nasabah',
};

const MOCK_RESULT = {
  kind: 'risk',
  items: [
    { description: 'Risiko selisih kas akibat salah hitung', rationale: 'Teller menghitung manual dalam tekanan antrean.' },
    { description: 'Risiko uang palsu tidak terdeteksi', rationale: 'Verifikasi alat deteksi terlewat saat ramai.' },
    { description: 'Risiko pencatatan setoran tidak lengkap', rationale: 'Slip setoran tidak diinput ke sistem.' },
  ],
  emptyReason: null,
};

function renderPopover(props?: Partial<React.ComponentProps<typeof AiSuggestionPopover>>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onApply = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AiSuggestionPopover kind="risk" context={CONTEXT} onApply={onApply} {...props} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return { onApply };
}

describe('AiSuggestionPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches on open and lists 3 suggestions', async () => {
    mockedApi.mockResolvedValue(MOCK_RESULT);
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole('button', { name: /sarankan risiko|Suggest risks/i }));
    expect(mockedApi).toHaveBeenCalledWith(
      '/api/ai/suggest-risk-controls',
      expect.objectContaining({ method: 'POST' }),
    );

    await waitFor(() => {
      expect(screen.getByText('Risiko selisih kas akibat salah hitung')).toBeInTheDocument();
    });
    expect(screen.getByText('Risiko uang palsu tidak terdeteksi')).toBeInTheDocument();
    expect(screen.getByText('Risiko pencatatan setoran tidak lengkap')).toBeInTheDocument();
  });

  it('applies the clicked suggestion and closes', async () => {
    mockedApi.mockResolvedValue(MOCK_RESULT);
    const user = userEvent.setup();
    const { onApply } = renderPopover();

    await user.click(screen.getByRole('button', { name: /sarankan risiko|Suggest risks/i }));
    await waitFor(() => {
      expect(screen.getByText('Risiko selisih kas akibat salah hitung')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Risiko selisih kas akibat salah hitung'));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('Risiko selisih kas akibat salah hitung');
  });

  it('shows an error with retry when the request fails', async () => {
    mockedApi.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderPopover();

    await user.click(screen.getByRole('button', { name: /sarankan risiko|Suggest risks/i }));
    await waitFor(() => {
      expect(screen.getByText(/Gagal mendapatkan saran|Failed to get AI suggestions/i)).toBeInTheDocument();
    });

    mockedApi.mockResolvedValue(MOCK_RESULT);
    await user.click(screen.getByRole('button', { name: /Coba lagi|Try again/i }));
    await waitFor(() => {
      expect(screen.getByText('Risiko selisih kas akibat salah hitung')).toBeInTheDocument();
    });
  });

  it('shows the fill-risk hint without fetching when blocked', async () => {
    const user = userEvent.setup();
    renderPopover({ kind: 'control', blocked: true });

    await user.click(screen.getByRole('button', { name: /Sarankan kontrol|Suggest controls/i }));
    await waitFor(() => {
      expect(screen.getByText(/Isi deskripsi risiko|Fill in the risk description/i)).toBeInTheDocument();
    });
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('skips the fetch for generic labels via the shared gate', async () => {
    const user = userEvent.setup();
    renderPopover({ context: { ...CONTEXT, nodeLabel: 'Proses 1' } });

    await user.click(screen.getByRole('button', { name: /sarankan risiko|Suggest risks/i }));
    await waitFor(() => {
      expect(screen.getByText(/too generic|Perspesifik nama langkah/i)).toBeInTheDocument();
    });
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it('renders a disabled trigger when locked', () => {
    renderPopover({ disabled: true });
    expect(screen.getByRole('button', { name: /sarankan risiko|Suggest risks/i })).toBeDisabled();
  });
});
