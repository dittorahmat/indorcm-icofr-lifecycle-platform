import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

describe('Runtime Safety Guard', () => {
  it('should fail when a duplicate React key is detected', () => {
    const DuplicateKeyComponent = () => (
      <div>
        {[1, 1].map((item) => (
          <span key={item}>Item {item}</span>
        ))}
      </div>
    );

    // We expect this to throw because of our logic in src/test/setup.ts
    expect(() => render(<DuplicateKeyComponent />)).toThrow('[RUNTIME SAFETY FAIL] Duplicate React Key detected');
  });

  it('should not fail when keys are unique', () => {
    const UniqueKeyComponent = () => (
      <div>
        {[1, 2].map((item) => (
          <span key={item}>Item {item}</span>
        ))}
      </div>
    );

    // This should render without any console error or throw
    expect(() => render(<UniqueKeyComponent />)).not.toThrow();
  });
});
