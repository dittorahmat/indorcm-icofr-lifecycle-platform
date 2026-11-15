import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserManagementPage } from '../UserManagementPage';
import { strictT } from '@/test/mock-i18n';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

// Mock current role to Admin so UserManagementPage renders
vi.mock('@/hooks/useCurrentRole', () => ({
  useCurrentRole: () => ({
    role: 'Admin',
    isLini1: false,
    isLini2: false,
    isLini3: false,
    isExternal: false,
    isAdmin: true,
  }),
}));

// Mock API clients and sonner
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    listUsers: vi.fn().mockResolvedValue([]),
    signUp: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UserManagementPage autocomplete semantics', () => {
  it('renders Add User dialog with standard credential autocomplete attributes', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <UserManagementPage />
      </QueryClientProvider>
    );

    const addUserBtn = screen.getByRole('button', { name: /Add User/i });
    expect(addUserBtn).toBeInTheDocument();
    fireEvent.click(addUserBtn);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/BUMN Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);

    expect(nameInput).toHaveAttribute('autoComplete', 'name');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
  });
});
