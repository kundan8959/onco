import type { ReactNode } from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="crud-modal-overlay" onClick={onCancel}>
      <div className="crud-modal-card confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="crud-modal-header">
          <h3>{title}</h3>
          <button type="button" className="ghost-button" onClick={onCancel}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <div className="crud-modal-body">
          <p className="confirm-message">{message}</p>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
