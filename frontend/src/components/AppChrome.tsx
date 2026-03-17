import ConfirmDialog from './ConfirmDialog';
import InlineNotice from './InlineNotice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { hideNotice } from '../store/uiSlice';
import { useEffect } from 'react';

export default function AppChrome({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const confirm = useAppSelector((state) => state.ui.confirm);
  const notice = useAppSelector((state) => state.ui.notice);
  const loadingCount = useAppSelector((state) => state.ui.loadingCount);

  // Auto-dismiss after 5 s (errors stay 8 s)
  useEffect(() => {
    if (!notice.open) return;
    const ms = (notice.kind === 'error' || notice.kind === 'danger') ? 8000 : 5000;
    const t = setTimeout(() => dispatch(hideNotice()), ms);
    return () => clearTimeout(t);
  }, [notice.open, notice.text, notice.kind, dispatch]);

  return (
    <>
      {loadingCount > 0 && <div className="global-loader-bar"><div className="global-loader-progress" /></div>}
      {notice.open && (
        <div className="global-notice-wrap">
          <InlineNotice kind={notice.kind as any} text={notice.text} onClose={() => dispatch(hideNotice())} />
        </div>
      )}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </>
  );
}
