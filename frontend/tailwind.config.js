/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'th-accent':   'var(--accent)',
        'th-accent2':  'var(--accent2)',
        'th-bg':       'var(--bg)',
        'th-bg2':      'var(--bg2)',
        'th-bg3':      'var(--bg3)',
        'th-surface':  'var(--surface)',
        'th-surface2': 'var(--surface2)',
        'th-surface3': 'var(--surface3)',
        'th-border':   'var(--border)',
        'th-border2':  'var(--border2)',
        'th-text':     'var(--text)',
        'th-text2':    'var(--text2)',
        'th-muted':    'var(--muted)',
        'th-text3':    'var(--text3)',
        'th-blue':     'var(--blue)',
        'th-green':    'var(--green)',
        'th-amber':    'var(--amber)',
        'th-red':      'var(--red)',
        'th-purple':   'var(--purple)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        'th':    'var(--r)',
        'th-md': 'var(--r2)',
        'th-lg': 'var(--r3)',
        'th-xl': 'var(--r4)',
      },
      boxShadow: {
        'th':    'var(--shadow)',
        'th-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
