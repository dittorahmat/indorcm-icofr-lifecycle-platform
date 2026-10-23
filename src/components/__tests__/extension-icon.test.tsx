import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ExtensionIcon } from '../layout/ExtensionIcon';

describe('ExtensionIcon', () => {
  it('renders a real Lucide icon from a manifest name', () => {
    const { container } = render(<ExtensionIcon name="Workflow" className="h-4 w-4" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('class')).toContain('lucide-workflow');
  });

  it('falls back to the help icon for an unknown manifest name', () => {
    const { container } = render(<ExtensionIcon name="NotARealIcon" className="h-4 w-4" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('class')).toContain('lucide-circle-question-mark');
  });
});
