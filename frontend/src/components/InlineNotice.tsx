export default function InlineNotice({
  kind = 'info',
  text,
}: {
  kind?: 'info' | 'success' | 'warning' | 'danger';
  text: string;
}) {
  return <div className={`inline-notice ${kind}`}>{text}</div>;
}
