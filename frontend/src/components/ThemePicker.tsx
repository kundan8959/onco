import { useEffect, useRef, useState } from 'react';
import './ThemePicker.css';

const DARK_THEMES = [
 { id: 'nebula', name: 'Nebula', tag: 'Space glass', swatch: 'swatch-nebula' },
 { id: 'aurora', name: 'Aurora', tag: 'Iridescent neon', swatch: 'swatch-aurora' },
 { id: 'void', name: 'Void', tag: 'Pure black luxury', swatch: 'swatch-void' },
 { id: 'dusk', name: 'Dusk', tag: 'Cinematic sunset', swatch: 'swatch-dusk' },
 { id: 'ocean', name: 'Ocean', tag: 'Deep teal dark', swatch: 'swatch-ocean' },
 { id: 'ember', name: 'Ember', tag: 'Warm amber dark', swatch: 'swatch-ember' },
 { id: 'forest', name: 'Forest', tag: 'Organic emerald', swatch: 'swatch-forest' },
 { id: 'arctic', name: 'Arctic', tag: 'Ice blue precise', swatch: 'swatch-arctic' },
 { id: 'chrome', name: 'Chrome', tag: 'Metallic brutalist', swatch: 'swatch-chrome' },
] as const;

const LIGHT_THEMES = [
 { id: 'rose', name: 'Rose', tag: 'Warm blush light', swatch: 'swatch-rose' },
 { id: 'slate', name: 'Slate', tag: 'Corporate precision', swatch: 'swatch-slate' },
 { id: 'pearl', name: 'Pearl', tag: 'Soft lavender light', swatch: 'swatch-pearl' },
] as const;

type ThemeId = (typeof DARK_THEMES)[number]['id'] | (typeof LIGHT_THEMES)[number]['id'];

const ALL_THEMES = [...DARK_THEMES, ...LIGHT_THEMES];
const STORAGE_KEY = 'oncocare-theme';

export default function ThemePicker() {
 const [open, setOpen] = useState(false);
 const [active, setActive] = useState<ThemeId>(() => {
 try { return (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'nebula'; }
 catch { return 'nebula'; }
 });
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
 document.documentElement.setAttribute('data-theme', active);
 try { localStorage.setItem(STORAGE_KEY, active); } catch {}
 }, [active]);

 useEffect(() => {
 if (!open) return;
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, [open]);

 const pick = (id: ThemeId) => { setActive(id); setOpen(false); };
 const current = ALL_THEMES.find(t => t.id === active);

 return (
 <div className="theme-picker-fab" ref={ref}>
 {open && (
 <div className="theme-picker-panel">
 <div className="theme-picker-header">
 <span className="theme-picker-title">Appearance</span>
 <span className="theme-picker-subtitle">12 themes · 2026</span>
 </div>

 <div className="theme-picker-group-label">Dark</div>
 <div className="theme-picker-options">
 {DARK_THEMES.map(t => (
 <button key={t.id} className={`theme-option ${active === t.id ? 'active' : ''}`} onClick={() => pick(t.id)}>
 <div className={`theme-swatch ${t.swatch}`} />
 <div className="theme-option-info">
 <span className="theme-option-name">{t.name}</span>
 <span className="theme-option-tag">{t.tag}</span>
 </div>
 {active === t.id && <i className="fas fa-check theme-option-check" />}
 </button>
 ))}
 </div>

 <div className="theme-picker-group-label" style={{ marginTop: 10 }}>Light</div>
 <div className="theme-picker-options">
 {LIGHT_THEMES.map(t => (
 <button key={t.id} className={`theme-option ${active === t.id ? 'active' : ''}`} onClick={() => pick(t.id)}>
 <div className={`theme-swatch ${t.swatch}`} />
 <div className="theme-option-info">
 <span className="theme-option-name">{t.name}</span>
 <span className="theme-option-tag">{t.tag}</span>
 </div>
 {active === t.id && <i className="fas fa-check theme-option-check" />}
 </button>
 ))}
 </div>
 </div>
 )}
 <button
 className={`theme-picker-trigger ${open ? 'open' : ''}`}
 onClick={() => setOpen(v => !v)}
 title={`Theme: ${current?.name || 'Nebula'}`}
 aria-label="Open theme picker"
 >
 {open ? <i className="fas fa-xmark" /> : <i className="fas fa-palette" />}
 </button>
 </div>
 );
}
