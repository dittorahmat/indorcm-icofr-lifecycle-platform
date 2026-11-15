import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BooleanIndicator } from '../BooleanIndicator';

describe('BooleanIndicator Component', () => {
  it('renders truthy text with default tone', () => {
    render(<BooleanIndicator value={true} />);
    const indicator = screen.getByText('Y');
    expect(indicator).toHaveClass('font-mono', 'text-xs', 'font-semibold', 'text-slate-800');
  });

  it('renders falsy text with muted tone', () => {
    render(<BooleanIndicator value={false} />);
    const indicator = screen.getByText('N');
    expect(indicator).toHaveClass('font-mono', 'text-xs', 'font-normal', 'text-slate-400');
  });

  it('handles string "Y" and "true" as truthy', () => {
    const { unmount } = render(<BooleanIndicator value="Y" />);
    expect(screen.getByText('Y')).toHaveClass('font-semibold');
    unmount();

    render(<BooleanIndicator value="true" />);
    expect(screen.getByText('Y')).toHaveClass('font-semibold');
  });

  it('renders primary tone with indigo styling when truthy', () => {
    render(<BooleanIndicator value={true} tone="primary" />);
    const indicator = screen.getByText('Y');
    expect(indicator).toHaveClass('text-indigo-700', 'font-semibold');
  });

  it('renders danger tone with rose styling when truthy', () => {
    render(<BooleanIndicator value={true} tone="danger" />);
    const indicator = screen.getByText('Y');
    expect(indicator).toHaveClass('text-rose-700', 'font-semibold');
  });

  it('supports custom truthy and falsy texts', () => {
    const { unmount } = render(<BooleanIndicator value={true} truthyText="Ya" falsyText="Tidak" />);
    expect(screen.getByText('Ya')).toBeInTheDocument();
    unmount();

    render(<BooleanIndicator value={false} truthyText="Ya" falsyText="Tidak" />);
    expect(screen.getByText('Tidak')).toBeInTheDocument();
  });
});
