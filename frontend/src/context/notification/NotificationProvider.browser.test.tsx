import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NotificationProvider from './NotificationProvider';
import { useNotification } from './useNotification';

// Helper component to trigger notification
const TestComponent = () => {
  const { display } = useNotification();
  return (
    <button
      onClick={() =>
        display({
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          caption: 'Test Caption',
          kind: 'success',
          timeout: 5000,
          onClose: vi.fn(),
          onCloseButtonClick: vi.fn(),
        })
      }
    >
      Show Notification
    </button>
  );
};

describe('NotificationProvider', () => {
  it('renders children', () => {
    render(
      <NotificationProvider>
        <div>Child</div>
      </NotificationProvider>,
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('displays a notification when display is called', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );
    act(() => {
      screen.getByText('Show Notification').click();
    });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Test Caption')).toBeInTheDocument();
  });

  it('removes the notification when onClose is triggered', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );
    act(() => {
      screen.getByText('Show Notification').click();
    });
    // Simulate close by finding the close button and clicking it
    const closeBtn = screen.getByLabelText('closes notification');
    act(() => {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // Notification should be removed
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('should fail if no provider is present', () => {
    expect(() => render(<TestComponent />)).toThrow(
      'useNotification must be used within a NotificationProvider',
    );
  });
});
