import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup(); // In case you use React Testing Library with Playwright
});

// Mock scrollIntoView if your tests rely on it
if (typeof window !== 'undefined' && window.HTMLElement?.prototype) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Provide a mock matchMedia if your components rely on it
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(), // Legacy method
    removeListener: vi.fn(), // Legacy method
    addEventListener: vi.fn(), // Modern method
    removeEventListener: vi.fn(), // Modern method
    dispatchEvent: vi.fn(),
  });
}
