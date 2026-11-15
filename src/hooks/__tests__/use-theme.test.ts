import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../use-theme';

describe('useTheme hook', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
    localStorage.clear();
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.remove();
  });

  it('initializes light theme and sets colorScheme on documentElement and meta', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');

    const meta = document.querySelector('meta[name="color-scheme"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute('content')).toBe('light');
  });

  it('keeps theme locked to light on toggleTheme call', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
