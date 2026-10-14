import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RegulatorySamplingTable } from '../RegulatorySamplingTable';
import { useForm } from 'react-hook-form';
import { TestFormValues } from '../test-schema';

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

function TestWrapper() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      testType: 'TOE',
      method: 'Inspection',
      result: 'Effective',
      sampleSize: 5,
      samples: [
        {
          sampleRef: 'SMP-2026-001',
          attrA: true,
          attrB: true,
          attrC: true,
          attrD: true,
          status: 'Pass',
          comments: 'Complete supporting documentation',
        },
      ],
    },
  });

  return (
    <RegulatorySamplingTable
      control={form.control}
      t={(k: string) => k}
    />
  );
}

describe('RegulatorySamplingTable Responsive & Anti-Slop', () => {
  it('renders both desktop table and mobile card view representations', () => {
    const { container } = render(<TestWrapper />);

    expect(container.querySelector('.block.md\\:hidden')).toBeInTheDocument();
    expect(container.querySelector('.hidden.md\\:block')).toBeInTheDocument();

    // Sample Ref input is dual-rendered for both mobile card and desktop table row
    const inputs = screen.getAllByDisplayValue('SMP-2026-001');
    expect(inputs).toHaveLength(2);
  });

  it('contains zero sub-12px font classes', () => {
    const { container } = render(<TestWrapper />);
    const html = container.innerHTML;

    expect(html).not.toContain('text-[8px]');
    expect(html).not.toContain('text-[9px]');
    expect(html).not.toContain('text-[10px]');
    expect(html).not.toContain('text-[11px]');
  });
});
