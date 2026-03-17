import type { ReactNode } from 'react';

export default function CrudModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="crud-modal-overlay" onClick={onClose}>
      <div className="crud-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="crud-modal-header">
          <h3>{title}</h3>
          <button type="button" className="ghost-button" onClick={onClose}>
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <div className="crud-modal-body">{children}</div>
      </div>
    </div>
  );
}
