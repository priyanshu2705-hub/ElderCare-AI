/** Colours come from CSS variables (see index.css) so High Contrast mode can swap them. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)', surface: 'var(--surface)', ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
        primary: 'var(--primary)', 'primary-dark': 'var(--primary-dark)', 'on-primary': 'var(--on-primary)',
        danger: 'var(--danger)', 'danger-dark': 'var(--danger-dark)',
        success: 'var(--success)', 'success-bg': 'var(--success-bg)',
        'warn-bg': 'var(--warn-bg)', 'warn-ink': 'var(--warn-ink)', 'info-bg': 'var(--info-bg)',
      },
      fontFamily: { sans: ['"Atkinson Hyperlegible"', 'Verdana', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
