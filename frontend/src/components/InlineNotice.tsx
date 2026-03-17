const ICONS: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '❌',
  error: '❌',
};

export default function InlineNotice({
  kind = 'info',
  text,
  onClose,
}: {
  kind?: 'info' | 'success' | 'warning' | 'danger' | 'error';
  text: string;
  onClose?: () => void;
}) {
  return (
    <div className={`inline-notice ${kind}`}>
      <span className="inline-notice-icon">{ICONS[kind]}</span>
      <span className="inline-notice-text">{text}</span>
      {onClose && (
        <button className="inline-notice-close" onClick={onClose} aria-label="Dismiss">✕</button>
      )}
    </div>
  );
}
