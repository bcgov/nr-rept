import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AuthCallback from './index';

vi.mock('@carbon/react', () => ({
  Loading: (props: { 'data-testid'?: string }) => <div data-testid={props['data-testid']} />,
}));

const completeLogin = vi.fn<() => Promise<void>>();
vi.mock('@/context/auth/useAuth', () => ({
  useAuth: () => ({ completeLogin }),
}));

let replace: ReturnType<typeof vi.fn>;
let originalLocation: Location;

beforeEach(() => {
  vi.clearAllMocks();
  completeLogin.mockResolvedValue(undefined);
  replace = vi.fn();
  originalLocation = window.location;
  // jsdom/happy-dom make `location` read-only; swap the whole object so the
  // component's navigation is observable instead of actually navigating.
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, replace, href: originalLocation.href },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

const flush = async () => {
  await act(async () => {});
};

describe('AuthCallback', () => {
  it('shows a spinner while the code is being exchanged', async () => {
    let settle: () => void = () => undefined;
    completeLogin.mockImplementation(() => new Promise<void>((r) => (settle = r)));

    render(<AuthCallback />);

    expect(screen.getByTestId('auth-callback-loading')).toBeTruthy();
    await act(async () => settle());
  });

  /**
   * The regression this file exists for. The original implementation used
   * `history.replaceState`, which updates the address bar WITHOUT firing
   * `popstate` — the only thing React Router listens for. The URL read
   * /dashboard while this component stayed mounted on its spinner, forever, with
   * nothing logged. A real navigation is what makes the router rebuild.
   */
  it('sends the browser to the dashboard with a real navigation', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');

    render(<AuthCallback />);
    await flush();

    expect(replace).toHaveBeenCalledWith('/dashboard');
    expect(replaceState).not.toHaveBeenCalled();
    replaceState.mockRestore();
  });

  it('exchanges the code before navigating', async () => {
    const order: string[] = [];
    completeLogin.mockImplementation(async () => {
      order.push('exchange');
    });
    replace.mockImplementation(() => order.push('navigate'));

    render(<AuthCallback />);
    await flush();

    expect(order).toEqual(['exchange', 'navigate']);
  });

  /**
   * The authorization code is single-use and its state entry is consumed by the
   * first exchange, so StrictMode's double-invoked effect would fail a
   * perfectly good sign-in. The ref guard is per component instance — a genuine
   * remount SHOULD exchange again, which is why this renders once under
   * StrictMode rather than unmounting and remounting.
   */
  it('exchanges the code once despite StrictMode double-mounting', async () => {
    render(
      <StrictMode>
        <AuthCallback />
      </StrictMode>,
    );
    await flush();

    expect(completeLogin).toHaveBeenCalledTimes(1);
  });

  it('returns to the sign-in screen when the exchange fails', async () => {
    completeLogin.mockRejectedValue(new Error('code already redeemed'));
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<AuthCallback />);
    await flush();

    expect(replace).toHaveBeenCalledWith('/');
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
