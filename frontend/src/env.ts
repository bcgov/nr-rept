declare global {
  interface Window {
    config: object;
  }
}

// Merges Vite build-time env vars with runtime values injected by Ansible into window.config.
// Runtime values (from config.js) take precedence over build-time values.
export const env: Record<string, string> = { ...import.meta.env, ...window.config };
