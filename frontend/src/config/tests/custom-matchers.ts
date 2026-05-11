import { expect } from 'vitest';

expect.extend({
  toContainText(received: HTMLElement, expected: string) {
    const pass = received.textContent?.includes(expected);
    return {
      pass,
      message: () =>
        `expected element ${pass ? 'not ' : ''}to contain text "${expected}", but got "${received.textContent}"`,
    };
  },
});
