import { useEffect, useState } from 'react';
import { LOGO_FULL_DARK_URL, LOGO_FULL_URL, LOGO_SMALL_LIGHT_URL, LOGO_SMALL_URL } from '../config';

const LIGHT_THEMES = new Set(['rose', 'slate', 'pearl', 'cobalt', 'mint', 'sand', 'sky', 'ivory', 'sage', 'coral']);

function getTheme(): string {
  return document.documentElement.getAttribute('data-theme') ?? 'nebula';
}

export function useThemeLogo() {
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(getTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  const isLight = LIGHT_THEMES.has(theme);
  return {
    logoSmall: isLight ? LOGO_SMALL_LIGHT_URL : LOGO_SMALL_URL,
    logoFull:  isLight ? LOGO_FULL_URL        : LOGO_FULL_DARK_URL,
    isLight,
  };
}
