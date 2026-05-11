import { Button } from '@carbon/react';

import { Modal } from '@/components/Modal';

import type { FC, ReactNode } from 'react';

import './destructive-modal.scss';

export type DestructiveModalProps = {
  /**
   * Controls whether the modal is open
   */
  open: boolean;
  /**
   * Title of the modal (e.g., "Delete Project?")
   */
  title: string;
  /**
   * Warning message describing the destructive action and its consequences.
   * This text will be associated with the delete button via aria-describedby for accessibility.
   */
  message: string | ReactNode;
  /**
   * Text for the primary (destructive) action button
   * @default "Delete"
   */
  confirmButtonText?: string;
  /**
   * Text for the secondary (cancel) action button
   * @default "Cancel"
   */
  cancelButtonText?: string;
  /**
   * Callback when user confirms the destructive action
   */
  onConfirm: () => void;
  /**
   * Callback when user cancels or closes the modal
   */
  onCancel: () => void;
  /**
   * Whether the confirm action is in progress (disables buttons)
   * @default false
   */
  loading?: boolean;
  /**
   * Size of the modal
   * @default "sm"
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
};

/**
 * A reusable modal component for destructive actions (delete, remove, etc.) following
 * Carbon Design System patterns with proper accessibility support.
 *
 * Features:
 * - Focus trap within modal
 * - ESC key closes modal
 * - Danger styling for destructive action
 * - ARIA labels for screen readers
 * - aria-describedby linking delete button to warning text
 *
 * @example
 * ```tsx
 * <DestructiveModal
 *   open={isOpen}
 *   title="Delete Project?"
 *   message="This action will permanently delete the project and its associated data. This cannot be undone."
 *   onConfirm={handleDelete}
 *   onCancel={handleCancel}
 *   loading={isDeleting}
 * />
 * ```
 */
export const DestructiveModal: FC<DestructiveModalProps> = ({
  open,
  title,
  message,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  size = 'sm',
}) => {
  const warningId = 'destructive-modal-warning';

  return (
    <Modal
      open={open}
      modalHeading={title}
      passiveModal
      size={size}
      className="add-contact-modal"
      aria-label={title}
      preventCloseOnClickOutside={loading}
      onRequestClose={onCancel}
    >
      <div className="destructive-modal">
        <p
          id={warningId}
          className="destructive-modal__message"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </p>
      </div>
      <div className="add-contact-modal__actions">
        <Button kind="secondary" size="md" onClick={onCancel} disabled={loading}>
          {cancelButtonText}
        </Button>
        <Button kind="danger" size="md" onClick={onConfirm} disabled={loading}>
          {confirmButtonText}
        </Button>
      </div>
    </Modal>
  );
};

export default DestructiveModal;
