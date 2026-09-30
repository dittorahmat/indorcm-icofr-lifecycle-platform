import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useForm, useFieldArray } from 'react-hook-form';
import { CSAForm } from '../CSAForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
  }),
}));

// Radix Select/Dropdown measure layout via ResizeObserver (absent in jsdom)
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

function makeSample(idx: number) {
  return {
    sampleRef: `S-00${idx + 1}`,
    glRowId: `gl-${idx + 1}`,
    controlResults: {
      'C-1': {
        implemented: idx !== 1,
        riskId: 'R-1',
        riskName: 'Risiko Satu',
        controlName: 'Kontrol Satu',
        evidenceUrl: '',
        comment: '',
      },
    },
  };
}

function Harness() {
  const form = useForm({ defaultValues: { period: '2025-Q1', result: 'Effective', samples: [makeSample(0), makeSample(1), makeSample(2)] } });
  const { fields, append } = useFieldArray({ control: form.control, name: 'samples' });
  const watchSamples = form.watch('samples');
  return (
    <CSAForm
      form={form as any}
      onSubmit={vi.fn()}
      onSaveDraft={vi.fn()}
      onBackToList={vi.fn()}
      onPrint={vi.fn()}
      onFileUpload={vi.fn()}
      isReadOnly={false}
      isAuthenticating={false}
      isPending={false}
      activeControls={[{ id: 'C-1', name: 'Kontrol Satu', code: 'C-001' }]}
      bpmRiskControlPairs={[]}
      watchSamples={watchSamples}
      fields={fields}
      append={(data: any) => append(data)}
      anyPointFailed={false}
      activeUploadRow={null}
      getFileNameFromUrl={() => ''}
      bpmCode="BPM-01"
      noGL="GL-100"
      bpmProcessId="proc-1"
      year={2025}
    />
  );
}

describe('CSAForm Mobile Stepper', () => {
  it('renders desktop matrix wrapper and mobile stepper container', () => {
    const { container } = render(<Harness />);
    expect(container.querySelector('.hidden.md\\:block')).not.toBeNull();
    expect(container.querySelector('[data-testid="csa-sample-stepper"]')).not.toBeNull();
  });

  it('navigates one sample per screen across 3+ samples', () => {
    const { container } = render(<Harness />);
    const stepper = within(container.querySelector('[data-testid="csa-sample-stepper"]') as HTMLElement);

    expect(stepper.getByText('Sample 1 of 3')).toBeInTheDocument();

    fireEvent.click(stepper.getByRole('button', { name: 'Next' }));
    expect(stepper.getByText('Sample 2 of 3')).toBeInTheDocument();

    fireEvent.click(stepper.getByRole('button', { name: 'Next' }));
    expect(stepper.getByText('Sample 3 of 3')).toBeInTheDocument();
    expect(stepper.getByRole('button', { name: 'Next' })).toBeDisabled();

    fireEvent.click(stepper.getByRole('button', { name: 'Back' }));
    expect(stepper.getByText('Sample 2 of 3')).toBeInTheDocument();
  });

  it('dual-renders the active sample reference in matrix and stepper', () => {
    render(<Harness />);
    // Desktop matrix input + mobile stepper input for the same sample
    expect(screen.getAllByDisplayValue('S-001')).toHaveLength(2);
  });

  it('shows per-sample pass/deficiency state in the stepper', () => {
    const { container } = render(<Harness />);
    const stepper = within(container.querySelector('[data-testid="csa-sample-stepper"]') as HTMLElement);
    // Sample 1 passes (implemented) while sample 2 fails
    expect(stepper.getByText('PASSED')).toBeInTheDocument();

    fireEvent.click(stepper.getByRole('button', { name: 'Next' }));
    expect(stepper.getByText('DEFICIENCY')).toBeInTheDocument();
  });
});
