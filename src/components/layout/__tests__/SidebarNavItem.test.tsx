import { describe, expect, it } from 'vitest';
import { SIDEBAR_ITEM_CLASS } from '../SidebarNavItem';

describe('SidebarNavItem hover contrast', () => {
  it('applies readable dark text on light hover and light text on dark hover', () => {
    expect(SIDEBAR_ITEM_CLASS).toContain('hover:bg-slate-100');
    expect(SIDEBAR_ITEM_CLASS).toContain('hover:text-slate-900');
    expect(SIDEBAR_ITEM_CLASS).toContain('dark:hover:bg-slate-800');
    expect(SIDEBAR_ITEM_CLASS).toContain('dark:hover:text-slate-100');
  });
});
