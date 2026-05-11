import { renderHook, act } from '@testing-library/react';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import useBreakpoint from './index';

describe('useBreakpoint', () => {
  const originalInnerWidth = window.innerWidth;
  let setWidth: (width: number) => void;

  beforeEach(() => {
    setWidth = (width: number) =>
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
      });
  });

  afterEach(() => {
    setWidth(originalInnerWidth);
  });

  it('returns the correct breakpoint for initial width', () => {
    setWidth(1600);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('max');
  });

  it('updates breakpoint on window resize', () => {
    const { result } = renderHook(() => useBreakpoint());

    setWidth(800);
    expect(result.current).toBe('md');

    setWidth(1200);
    expect(result.current).toBe('lg');

    setWidth(600);
    expect(result.current).toBe('sm');
  });
});
