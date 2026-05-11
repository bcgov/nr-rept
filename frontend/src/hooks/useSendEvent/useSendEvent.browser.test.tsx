import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { eventHandler } from './eventHandler';

import useSendEvent from './index';

import type { GlobalEvent, EventType } from './types';

const makeEvent = (eventType: EventType): GlobalEvent => ({
  title: 'Test',
  description: 'Test description',
  eventType,
});

describe('useSendEvent', () => {
  it('should allow subscribing and receiving events', () => {
    const { result } = renderHook(() => useSendEvent());
    const handler = vi.fn();
    const event = makeEvent('info');

    // Subscribe
    act(() => {
      result.current.subscribe('info', handler);
    });

    // Send event
    act(() => {
      result.current.sendEvent(event);
    });

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should allow unsubscribing from events', () => {
    const { result } = renderHook(() => useSendEvent());
    const handler = vi.fn();
    const event = makeEvent('error');

    // Subscribe and then unsubscribe
    let unsubscribe: () => void;
    act(() => {
      unsubscribe = result.current.subscribe('error', handler);
    });
    act(() => {
      unsubscribe!();
    });

    // Send event
    act(() => {
      result.current.sendEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support multiple listeners for the same event type', () => {
    const { result } = renderHook(() => useSendEvent());
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const event = makeEvent('success');

    act(() => {
      result.current.subscribe('success', handler1);
      result.current.subscribe('success', handler2);
    });

    act(() => {
      result.current.sendEvent(event);
    });

    expect(handler1).toHaveBeenCalledWith(event);
    expect(handler2).toHaveBeenCalledWith(event);
  });

  it('should not call listeners for other event types', () => {
    const { result } = renderHook(() => useSendEvent());
    const handler = vi.fn();
    const event = makeEvent('warning');

    act(() => {
      result.current.subscribe('info', handler);
    });

    act(() => {
      result.current.sendEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should allow direct unsubscribe via hook', () => {
    const { result } = renderHook(() => useSendEvent());
    const handler = vi.fn();
    const event = makeEvent('info');

    act(() => {
      result.current.subscribe('info', handler);
      result.current.unsubscribe('info', handler);
    });

    act(() => {
      result.current.sendEvent(event);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not throw or call listeners for invalid event type in dispatch', () => {
    expect(() =>
      // @ts-expect-error Argument of type '"not-an-event"' is not assignable to parameter of type 'EventType'.
      eventHandler.dispatch('not-an-event', {
        eventType: 'not-an-event',
        title: '',
        description: '',
      }),
    ).not.toThrow();
  });
});
