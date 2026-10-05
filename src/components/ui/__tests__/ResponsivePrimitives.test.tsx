import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';

describe('Mobile-responsive primitives (320px → desktop)', () => {
  it('TabsList scrolls horizontally with touch panning on narrow viewports', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="a">Simulasi</TabsTrigger>
          <TabsTrigger value="b">Master GL</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    const list = screen.getByTestId('tabs-list');
    expect(list.className).toContain('overflow-x-auto');
    expect(list.className).toContain('touch-pan-x');
    expect(list.className).toContain('max-w-full');
  });

  it('Calendar is capped to the viewport width so popovers never overflow 320px', () => {
    const { container } = render(<Calendar data-testid="calendar" />);
    const root = screen.getByTestId('calendar');
    expect(root.className).toContain('max-w-[calc(100vw-2rem)]');
    const dayPickerRoot = container.querySelector('.rdp-root');
    expect(dayPickerRoot).not.toBeNull();
    expect(dayPickerRoot?.className ?? '').toContain('w-fit');
    expect(container.querySelector('[class*="max-w-[calc(100vw-2rem)]"]')).not.toBeNull();
  });

  it('MobileDesktopBanner only renders below md and exposes a stable test hook', () => {
    render(<MobileDesktopBanner recordCount={12} />);
    const banner = screen.getByTestId('mobile-desktop-banner');
    expect(banner.className).toContain('md:hidden');
    expect(banner.textContent).toContain('12');
  });
});
