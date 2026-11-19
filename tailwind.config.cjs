// Tailwind v3 matches the existing browser CDN styling; no framework upgrade.
// Scan the complete dashboard, including JS-rendered MCQ classes.
module.exports = {
  content: ['./public/index.html', './public/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sjn: {
          red: '#DC2626', crimson: '#991B1B', darkred: '#450A0A',
          black: '#09090B', card: '#121215', border: '#27272A',
          accent: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  }
};
