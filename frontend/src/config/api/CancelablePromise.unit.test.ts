import { describe, expect, it, vi } from 'vitest';

import { CancelablePromise, CancelError } from './CancelablePromise';

describe('CancelablePromise', () => {
  it('should resolve with the correct value', async () => {
    const promise = new CancelablePromise((resolve) => setTimeout(() => resolve('done'), 10));
    await expect(promise).resolves.toBe('done');
  });

  it('should reject with the correct error', async () => {
    const promise = new CancelablePromise((_, reject) =>
      setTimeout(() => reject(new Error('fail')), 10),
    );
    await expect(promise).rejects.toThrow('fail');
  });

  it('should cancel the promise', async () => {
    const promise = new CancelablePromise((resolve) => setTimeout(() => resolve('done'), 50));
    promise.cancel();
    await expect(promise).rejects.toThrow('Request aborted');
  });

  it('should expose isCancelled property', async () => {
    const promise = new CancelablePromise((resolve) => setTimeout(() => resolve('ok'), 10));
    expect(promise.isCancelled).toBe(false);
    promise.cancel();
    await expect(promise).rejects.toThrow('Request aborted');
    expect(promise.isCancelled).toBe(true);
  });

  it('should call cancel handlers on cancel', async () => {
    const handler = vi.fn();
    const promise = new CancelablePromise((resolve, _reject, onCancel) => {
      onCancel(handler);
      setTimeout(() => resolve('ok'), 10);
    });
    promise.cancel();
    await expect(promise).rejects.toThrow('Request aborted');
    expect(handler).toHaveBeenCalled();
  });

  it('should not call cancel handlers if already resolved', async () => {
    const handler = vi.fn();
    const promise = new CancelablePromise((resolve, _reject, onCancel) => {
      onCancel(handler);
      resolve('ok');
    });
    await promise;
    promise.cancel();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should support finally', async () => {
    const promise = new CancelablePromise((resolve) => setTimeout(() => resolve('done'), 10));
    const fn = vi.fn();
    await promise.finally(fn);
    expect(fn).toHaveBeenCalled();
  });

  it('should have correct Symbol.toStringTag', () => {
    const promise = new CancelablePromise((resolve) => resolve('ok'));
    expect(Object.prototype.toString.call(promise)).toBe('[object Cancellable Promise]');
  });
});

describe('CancelError', () => {
  it('should set name and isCancelled', () => {
    const err = new CancelError('test');
    expect(err.name).toBe('CancelError');
    expect(err.isCancelled).toBe(true);
  });
});

// Additional coverage for CancelablePromise edge cases
describe('CancelablePromise advanced coverage', () => {
  it('should not resolve/reject/cancel twice', async () => {
    let extResolve: any, extReject: any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const promise = new CancelablePromise((resolve, reject, _onCancel) => {
      extResolve = resolve;
      extReject = reject;
    });
    // First resolve
    extResolve('first');
    // Try to resolve again
    extResolve('second');
    // Try to reject after resolved
    extReject('fail');
    // Try to cancel after resolved
    promise.cancel();
    await expect(promise).resolves.toBe('first');
  });

  it('should handle cancel handler error and not reject promise', async () => {
    const handler = vi.fn(() => {
      throw new Error('fail');
    });
    const promise = new CancelablePromise((resolve, _reject, onCancel) => {
      onCancel(handler);
      setTimeout(() => resolve('ok'), 20);
    });
    // Should not throw, but log a warning and not reject due to handler error
    promise.cancel();
    expect(handler).toHaveBeenCalled();
  });

  it('should not call cancel handlers or reject if already cancelled', async () => {
    const handler = vi.fn();
    let extResolve: any, extReject: any;
    const promise = new CancelablePromise((resolve, reject, onCancel) => {
      extResolve = resolve;
      extReject = reject;
      onCancel(handler);
    });
    promise.cancel();
    // Try to resolve, reject, or cancel again after cancelled
    extResolve('foo');
    extReject('bar');
    promise.cancel();
    expect(handler).toHaveBeenCalledTimes(1); // Only called on first cancel
    await expect(promise).rejects.toThrow('Request aborted');
  });
});
