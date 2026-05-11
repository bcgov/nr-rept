import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import useDebounce from './index';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('debounces string value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'b' });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('b');
  });

  it('debounces number value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 1 },
    });
    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(2);
  });

  it('debounces object value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: { a: 1 } },
    });
    rerender({ value: { a: 2 } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toEqual({ a: 2 });
  });

  it('respects different debounce times', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'x', delay: 400 },
    });
    rerender({ value: 'y', delay: 400 });
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(result.current).toBe('x');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('y');
  });
});
