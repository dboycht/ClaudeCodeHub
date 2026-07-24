import { Theme } from '../types/theme';

export const jetbrainsDark: Theme = {
  id: 'jetbrains-dark',
  name: { zh: 'JetBrains 暗色', en: 'JetBrains Dark' },
  colors: {
    '--bg-primary': '#2B2B2B',
    '--bg-secondary': '#313335',
    '--bg-tertiary': '#3C3F41',
    '--bg-hover': '#3E4042',
    '--text-primary': '#A9B7C6',
    '--text-secondary': '#808080',
    '--text-muted': '#606060',
    '--border-color': '#3C3F41',
    '--accent-primary': '#4B6EAF',
    '--accent-hover': '#5B7EC0',
    '--danger': '#BC3F3C',
    '--warning': '#CCA700',
    '--success': '#6A8759',
    '--info': '#4B6EAF',
    '--scrollbar-thumb': '#4A4D50',
    '--scrollbar-track': '#2B2B2B',
    '--acrylic-bg': 'rgba(43, 43, 43, 0.85)',
    '--acrylic-blur': '20px',
    '--shadow': '0 2px 8px rgba(0,0,0,0.3)',
  },
};
