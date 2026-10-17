import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Settings } from '@shared/types';
import { strictT, validateI18nKey } from '@/test/mock-i18n';

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), loading: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT, i18n: { language: 'en' } }),
}));

import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { SettingsPage } from '../SettingsPage';
import { WEBHOOK_FIELDS } from '../components/settings-webhook-config';

/** Vetted server reply, never recomputed from the implementation. */
const SETTINGS_FIXTURE: Settings = {
  id: 'settings-1',
  companyName: 'PT Contoh Nusantara',
  ceoName: 'Andi Wijaya',
  cfoName: 'Sri Lestari',
  fiscalYear: 2026,
  isPeriodLocked: false,
};

const readSource = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf-8');

/** Bodies of every captured request for one HTTP method (plain strings, no parsing). */
function requestBodies(method: string): string[] {
  return vi.mocked(api).mock.calls
    .filter(([, init]) => init?.method === method)
    .map(([, init]) => String(init?.body));
}

function mockApi(writeSettings?: () => Promise<unknown>) {
  vi.mocked(api).mockImplementation((path: string, init?: RequestInit) => {
    if (path === '/api/settings' && init?.method === 'PUT') {
      return writeSettings ? writeSettings() : Promise.resolve({ ok: true });
    }
    if (path === '/api/settings') return Promise.resolve(SETTINGS_FIXTURE);
    return Promise.resolve({ ok: true });
  });
}

function renderPage(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SettingsPage />
    </QueryClientProvider>,
  );
  return client;
}

async function findRow(provider: string): Promise<HTMLElement> {
  const rows = await screen.findAllByTestId('settings-webhook-row');
  const row = rows.find((el) => el.dataset.provider === provider);
  if (!row) throw new Error(`no webhook row for provider ${provider}`);
  return row;
}

describe('SettingsPage webhooks + settings draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi();
  });

  it('renders one webhook row per WEBHOOK_FIELDS entry, in config order', async () => {
    renderPage();

    const rows = await screen.findAllByTestId('settings-webhook-row');
    expect(rows).toHaveLength(WEBHOOK_FIELDS.length);
    expect(WEBHOOK_FIELDS).toHaveLength(3);
    expect(rows.map((row) => row.dataset.provider)).toEqual(
      WEBHOOK_FIELDS.map((field) => field.provider),
    );
    for (const field of WEBHOOK_FIELDS) {
      const row = rows.find((el) => el.dataset.provider === field.provider);
      expect(row).toBeDefined();
      if (row) {
        expect(within(row).getByPlaceholderText(field.placeholderKey)).toBeInTheDocument();
      }
    }
  });

  it('resolves every data-carried webhook label key in the en bundle', () => {
    for (const field of WEBHOOK_FIELDS) {
      validateI18nKey(field.titleKey);
      validateI18nKey(field.descKey);
      validateI18nKey(field.placeholderKey);
    }
  });

  it('renders the rows from the config array, not hand-written per-provider copies', () => {
    const cardSource = readSource('../components/SettingsWebhooksCard.tsx');
    expect(cardSource).toContain('WEBHOOK_FIELDS.map(');

    const pageSource = readSource('../SettingsPage.tsx');
    expect(pageSource).not.toContain('slackWebhookUrl');
    expect(pageSource).not.toContain('webhookSettings.slackTitle');
    expect(pageSource).not.toContain('useState');
    expect(pageSource).not.toContain('useEffect');
  });

  it('keeps the query cache as the source of truth and writes nothing before Save', async () => {
    const client = renderPage();

    const companyInput = await screen.findByLabelText('Company Name');
    fireEvent.change(companyInput, { target: { value: 'PT Baru' } });

    // The cache write notifies the observer on the next microtask, so the
    // controlled input re-renders from the cache — not from local component state.
    expect(await screen.findByDisplayValue('PT Baru')).toBe(companyInput);
    expect(client.getQueryData<Settings>(['settings'])?.companyName).toBe('PT Baru');
    expect(requestBodies('PUT')).toHaveLength(0);
  });

  it('saves the cache snapshot as exactly one whole-object PUT', async () => {
    const client = renderPage();

    fireEvent.change(await screen.findByLabelText('Company Name'), {
      target: { value: 'PT Baru' },
    });
    fireEvent.change(screen.getByLabelText('Global Fiscal Year'), { target: { value: '2030' } });
    await screen.findByDisplayValue('2030');
    const draftSnapshot = JSON.stringify(client.getQueryData(['settings']));

    fireEvent.click(screen.getByRole('button', { name: /save global changes/i }));

    await waitFor(() => expect(requestBodies('PUT')).toHaveLength(1));
    expect(requestBodies('PUT')[0]).toBe(
      JSON.stringify({ ...SETTINGS_FIXTURE, companyName: 'PT Baru', fiscalYear: 2030 }),
    );
    expect(requestBodies('PUT')[0]).toBe(draftSnapshot);
  });

  it('surfaces a toast when saving fails', async () => {
    mockApi(() => Promise.reject(new Error('PUT boom')));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /save global changes/i }));

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledWith('PUT boom'));
  });

  it('toggling a webhook switch changes only that provider enabled flag', async () => {
    const client = renderPage();

    const slackRow = await findRow('slack');
    fireEvent.click(within(slackRow).getByRole('switch'));

    // The row re-renders from the cache: badge flips to the enabled label.
    await waitFor(() =>
      expect(within(slackRow).getByText('webhookSettings.enabled')).toBeInTheDocument(),
    );

    const draft = client.getQueryData<Settings>(['settings']);
    expect(draft).toEqual({ ...SETTINGS_FIXTURE, slackEnabled: true });
    expect(draft?.msTeamsEnabled).toBeUndefined();
    expect(draft?.genericWebhookEnabled).toBeUndefined();
  });

  it('disables the test button without a URL and posts the configured provider + URL', async () => {
    renderPage();

    const teamsRow = await findRow('msTeams');
    const testButton = within(teamsRow).getByRole('button', {
      name: 'webhookSettings.testWebhook',
    });
    expect(testButton).toBeDisabled();

    fireEvent.change(within(teamsRow).getByPlaceholderText('webhookSettings.teamsPlaceholder'), {
      target: { value: 'https://teams.example/hook' },
    });
    await waitFor(() => expect(testButton).not.toBeDisabled());

    fireEvent.click(testButton);

    await waitFor(() => expect(requestBodies('POST')).toHaveLength(1));
    expect(requestBodies('POST')[0]).toBe(
      JSON.stringify({ provider: 'msTeams', webhookUrl: 'https://teams.example/hook' }),
    );
  });
});
