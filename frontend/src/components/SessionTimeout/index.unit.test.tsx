import { act, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SessionTimeout, { SESSION_EXPIRED_FLAG } from './index';

// Carbon's Button forwards a ref (the focus trap needs it) but drags in a lot of
// styling machinery that has nothing to do with this component's behaviour.
vi.mock('@carbon/react', () => ({
  Button: forwardRef<HTMLButtonElement, { children?: React.ReactNode; onClick?: () => void }>(
    ({ children, onClick }, ref) => (
      <button ref={ref} type="button" onClick={onClick}>
        {children}
      </button>
    ),
  ),
}));

vi.mock('@carbon/icons-react', () => ({
  WarningFilled: () => <svg data-testid="warn-icon" />,
}));

const logout = vi.fn();
const forceRefreshSession = vi.fn<() => Promise<void>>();
const ensureFreshToken = vi.fn<() => Promise<string | undefined>>();
const display = vi.fn();

vi.mock('@/context/auth/useAuth', () => ({
  useAuth: () => ({ logout, forceRefreshSession, ensureFreshToken }),
}));

vi.mock('@/context/notification/useNotification', () => ({
  useNotification: () => ({ display }),
}));

// Mirrors the component's own constants. Deliberately re-stated rather than
// exported from the component: if someone retunes the timings, these tests
// should fail and make them think about the refresh-token ceiling, not follow
// the new numbers silently.
const IDLE_TIMEOUT_MS = 25 * 60 * 1000;
const WARNING_BEFORE_MS = 5 * 60 * 1000;
const UNTIL_WARNING_MS = IDLE_TIMEOUT_MS - WARNING_BEFORE_MS; // 20 min

/** Advance fake timers inside act() so React flushes the state the tick sets. */
const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const countdown = () => document.querySelector('.session-timeout__count');
const dialog = () => screen.queryByRole('alertdialog');

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  forceRefreshSession.mockResolvedValue(undefined);
  ensureFreshToken.mockResolvedValue('token');
  sessionStorage.clear();
  // The guard is inert under automated browsers; happy-dom does not promise a
  // particular value, so pin it for the tests that expect the guard to run.
  Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionTimeout', () => {
  describe('the idle clock', () => {
    it('shows nothing while the user is inside the idle window', async () => {
      render(<SessionTimeout />);

      await advance(UNTIL_WARNING_MS - 1000);

      expect(dialog()).toBeNull();
    });

    it('opens the warning once five minutes remain', async () => {
      render(<SessionTimeout />);

      await advance(UNTIL_WARNING_MS);

      expect(dialog()).not.toBeNull();
      expect(screen.getByText(/about to be logged out/i)).toBeTruthy();
    });

    it('counts down in M:SS', async () => {
      render(<SessionTimeout />);

      await advance(UNTIL_WARNING_MS);
      expect(countdown()?.textContent).toBe('5:00');

      await advance(11_000);
      expect(countdown()?.textContent).toBe('4:49');
    });

    /**
     * The deadline is recomputed from an absolute origin every tick rather than
     * decremented, so a laptop that slept through the window still expires on
     * wake instead of resuming the countdown where it left off.
     */
    it('expires immediately when time jumps past the deadline', async () => {
      render(<SessionTimeout />);

      await advance(IDLE_TIMEOUT_MS + 60_000);

      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('reaching zero', () => {
    it('signs out and leaves the session-expired notice for the login screen', async () => {
      render(<SessionTimeout />);

      await advance(IDLE_TIMEOUT_MS);

      expect(logout).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(SESSION_EXPIRED_FLAG)).toBe('1');
      expect(dialog()).toBeNull();
    });

    it('still signs out when sessionStorage is unavailable', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage disabled');
      });

      render(<SessionTimeout />);
      await advance(IDLE_TIMEOUT_MS);

      expect(logout).toHaveBeenCalledTimes(1);
      setItem.mockRestore();
    });

    it('turns the countdown red and reveals the icon in the last thirty seconds', async () => {
      render(<SessionTimeout />);

      await advance(UNTIL_WARNING_MS);
      expect(countdown()?.classList.contains('session-timeout__count--danger')).toBe(false);

      await advance(WARNING_BEFORE_MS - 30_000);

      expect(countdown()?.classList.contains('session-timeout__count--danger')).toBe(true);
      expect(screen.getByTestId('warn-icon')).toBeTruthy();
    });
  });

  describe('"Stay logged in"', () => {
    it('renews the session, closes the dialog and confirms', async () => {
      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      fireEvent.click(screen.getByRole('button', { name: /stay logged in/i }));
      await act(async () => {});

      expect(forceRefreshSession).toHaveBeenCalledTimes(1);
      expect(dialog()).toBeNull();
      expect(logout).not.toHaveBeenCalled();
      expect(display).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'success', title: "You're still logged in" }),
      );
    });

    /** The button's promise: the full idle window again, not the leftover. */
    it('restarts the whole idle window', async () => {
      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      fireEvent.click(screen.getByRole('button', { name: /stay logged in/i }));
      await act(async () => {});

      // The old deadline passes with the dialog still shut.
      await advance(WARNING_BEFORE_MS + 1000);
      expect(dialog()).toBeNull();
      expect(logout).not.toHaveBeenCalled();

      // A fresh window later, it warns again.
      await advance(UNTIL_WARNING_MS - WARNING_BEFORE_MS);
      expect(dialog()).not.toBeNull();
    });

    /**
     * The refresh token can be gone before the countdown reaches zero — revoked,
     * or the realm session ended elsewhere. That is a real expiry, so it takes
     * the expiry path (notice included) rather than silently failing open.
     */
    it('treats a failed renewal as a real expiry', async () => {
      forceRefreshSession.mockRejectedValue(new Error('refresh token expired'));

      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      fireEvent.click(screen.getByRole('button', { name: /stay logged in/i }));
      await act(async () => {});

      expect(logout).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(SESSION_EXPIRED_FLAG)).toBe('1');
    });

    it('ignores a second click while the first is in flight', async () => {
      let release: () => void = () => undefined;
      forceRefreshSession.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );

      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      const stay = screen.getByRole('button', { name: /stay logged in/i });
      fireEvent.click(stay);
      fireEvent.click(stay);
      await act(async () => {
        release();
      });

      expect(forceRefreshSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('"Log out"', () => {
    /** Deliberate sign-out, so the login screen must NOT claim the session expired. */
    it('signs out without the session-expired notice', async () => {
      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      fireEvent.click(screen.getByRole('button', { name: /^log out$/i }));

      expect(logout).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(SESSION_EXPIRED_FLAG)).toBeNull();
    });
  });

  describe('activity', () => {
    it('resets the idle clock so the warning never opens', async () => {
      render(<SessionTimeout />);

      // Nudge every ten minutes, well inside the window, for over an hour.
      for (let i = 0; i < 6; i += 1) {
        await advance(10 * 60 * 1000);
        fireEvent.keyDown(window, { key: 'a' });
      }

      expect(dialog()).toBeNull();
      expect(logout).not.toHaveBeenCalled();
    });

    /** Once the dialog is up the clock is frozen — the user must choose. */
    it('is ignored while the warning is open', async () => {
      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      fireEvent.keyDown(window, { key: 'a' });
      fireEvent.mouseMove(window);
      await advance(WARNING_BEFORE_MS);

      expect(logout).toHaveBeenCalledTimes(1);
    });

    it('keeps the token alive at most once a minute', async () => {
      render(<SessionTimeout />);

      // Ten nudges across ~two and a half minutes.
      for (let i = 0; i < 10; i += 1) {
        fireEvent.mouseMove(window);
        await advance(15_000);
      }

      expect(ensureFreshToken).toHaveBeenCalled();
      expect(ensureFreshToken.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });

  describe('the dialog itself', () => {
    it('swallows Escape rather than letting it dismiss the warning', async () => {
      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

      expect(dialog()).not.toBeNull();
      expect(logout).not.toHaveBeenCalled();
    });

    it('is a modal alertdialog holding focus', async () => {
      render(<SessionTimeout />);
      await advance(UNTIL_WARNING_MS);

      const el = screen.getByRole('alertdialog');
      expect(el.getAttribute('aria-modal')).toBe('true');
      expect(document.activeElement).toBe(el);
    });
  });

  /**
   * Every spec in the e2e suite shares one refresh token via storageState, and
   * this component rotates it on activity — which would poison the token for the
   * specs that run later. Hence the webdriver gate.
   */
  it('is inert under an automated browser', async () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true });

    render(<SessionTimeout />);
    await advance(IDLE_TIMEOUT_MS + 60_000);

    expect(dialog()).toBeNull();
    expect(logout).not.toHaveBeenCalled();
    expect(ensureFreshToken).not.toHaveBeenCalled();
  });
});
