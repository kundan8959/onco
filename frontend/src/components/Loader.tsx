import { ReactNode } from 'react';

type LoaderProps = {
  loading?: boolean;
  label?: string;
  inline?: boolean;
  overlay?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  className?: string;
};

export default function Loader({
  loading = true,
  label = 'Loading…',
  inline = false,
  overlay = false,
  size = 'md',
  children,
  className = '',
}: LoaderProps) {
  if (!loading) return <>{children}</>;

  const shellClass = [
    'loader-shell',
    inline ? 'loader-shell-inline' : '',
    overlay ? 'loader-shell-overlay' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass} aria-live="polite" aria-busy="true">
      <div className={`loader-spinner loader-${size}`} />
      <span className="loader-label">{label}</span>
      {overlay ? <div className="loader-overlay-content">{children}</div> : null}
    </div>
  );
}
