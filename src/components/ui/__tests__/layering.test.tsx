import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent } from '@/components/ui/popover';

describe('UI Layering Integrity', () => {
  it('SelectContent SHALL have z-[1100] to appear above Dialog (z-1000)', async () => {
    render(
      <Select open={true}>
        <SelectContent data-testid="select-content">
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const content = screen.getByTestId('select-content');
    expect(content.className).toContain('z-[1100]');
  });

  it('PopoverContent SHALL have z-[1100] to appear above Dialog (z-1000)', () => {
    render(
      <Popover open={true}>
        <PopoverContent data-testid="popover-content">
          Popover content
        </PopoverContent>
      </Popover>
    );
    
    const content = screen.getByTestId('popover-content');
    expect(content.className).toContain('z-[1100]');
  });

  it('DialogContent SHALL have z-[1000] as the baseline for modals', () => {
    render(
      <Dialog open={true}>
        <DialogContent data-testid="dialog-content">
          Dialog content
        </DialogContent>
      </Dialog>
    );
    
    const content = screen.getByTestId('dialog-content');
    expect(content.className).toContain('z-[1000]');
  });
});
