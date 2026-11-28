import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Home, LogOut } from 'lucide-react';
import { SidebarNavItemRow } from '../SidebarNavItem';

vi.mock('@/components/ui/sidebar', () => ({
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  SidebarMenuButton: ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div data-testid="sidebar-btn" className={className} onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock('../SidebarBadges', () => ({
  NotificationBadge: () => null,
  PendingApprovalBadge: () => null,
}));

describe('SidebarNavItemRow hover contrast', () => {
  it('renders navigation item with readable dark text on light hover and light text on dark hover', () => {
    render(
      <MemoryRouter>
        <ul>
          <SidebarNavItemRow
            item={{ kind: 'link', path: '/scoping/approval', labelKey: 'Materiality Approval', icon: Home }}
            role="Admin"
            isActivePath={() => false}
            withYear={(p) => p}
            onAction={vi.fn()}
          />
        </ul>
      </MemoryRouter>,
    );

    const btn = screen.getByTestId('sidebar-btn');
    expect(btn.className).toContain('hover:bg-slate-100');
    expect(btn.className).toContain('hover:text-slate-900');
    expect(btn.className).toContain('dark:hover:bg-slate-800');
    expect(btn.className).toContain('dark:hover:text-slate-100');
  });

  it('renders action item with readable hover contrast', () => {
    render(
      <MemoryRouter>
        <ul>
          <SidebarNavItemRow
            item={{ kind: 'action', action: 'logout', labelKey: 'Logout', icon: LogOut }}
            role="Admin"
            isActivePath={() => false}
            withYear={(p) => p}
            onAction={vi.fn()}
          />
        </ul>
      </MemoryRouter>,
    );

    const btn = screen.getByTestId('sidebar-btn');
    expect(btn.className).toContain('hover:bg-rose-50');
    expect(btn.className).toContain('hover:text-rose-700');
  });
});
