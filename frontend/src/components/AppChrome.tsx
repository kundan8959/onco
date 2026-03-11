import ConfirmDialog from './ConfirmDialog';
import InlineNotice from './InlineNotice';
import { useAppSelector } from '../store/hooks';

export default function AppChrome({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const confirm = useAppSelector((state) => state.ui.confirm);
  const notice = useAppSelector((state) => state.ui.notice);
  const loadingCount = useAppSelector((state) => state.ui.loadingCount);

  return (
    <>
      {loadingCount > 0 && <div className="global-loader-bar"><div className="global-loader-progress" /></div>}
      {notice.open && (
        <div className="global-notice-wrap">
          <InlineNotice kind={notice.kind as any} text={notice.text} />
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
