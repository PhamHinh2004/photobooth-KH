/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface, #ffffff)',
        'surface-variant': 'var(--surface-variant, #f1f3f4)',
        secondary: 'var(--secondary, #0284c7)',
        'secondary-container': 'var(--secondary-container, #e0f2fe)',
        'on-surface': 'var(--on-surface, #1f2937)',
        'on-surface-variant': 'var(--on-surface-variant, #4b5563)',
        'outline-variant': 'var(--outline-variant, #d1d5db)',
        outline: 'var(--outline, #9ca3af)',
        error: 'var(--error, #dc2626)',
        'error-container': 'var(--error-container, #fee2e2)',
        tertiary: 'var(--tertiary, #6b7280)',
      },
    },
  },
  plugins: [],
}
