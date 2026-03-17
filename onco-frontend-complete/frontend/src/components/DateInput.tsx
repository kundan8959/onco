import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  name?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A date field that lets users type freely (YYYY-MM-DD) without the browser
 * auto-advancing between month/day/year segments. Includes a calendar icon
 * button that opens the native date picker as a fallback.
 */
export default function DateInput({ value, onChange, required, name }: Props) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        required={required}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        title="Open date picker"
        onClick={() => pickerRef.current?.showPicker?.()}
        style={{
          background: 'none',
          border: '1px solid var(--border-color, #ccc)',
          borderRadius: 4,
          cursor: 'pointer',
          padding: '4px 6px',
          fontSize: 13,
          lineHeight: 1,
          color: 'var(--color-text-muted, #888)',
          flexShrink: 0,
        }}
      >
        📅
      </button>
      {/* Hidden native picker — opened programmatically by the button above */}
      <input
        ref={pickerRef}
        type="date"
        value={DATE_RE.test(value) ? value : ''}
        onChange={e => onChange(e.target.value)}
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}
