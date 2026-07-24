import { Theme } from '../types/theme';

export const monokai: Theme = {
  id: 'monokai',
  name: { zh: 'Monokai', en: 'Monokai' },
  colors: {
    '--bg-primary': '#272822',
    '--bg-secondary': '#2D2E29',
    '--bg-tertiary': '#383830',
    '--bg-hover': '#3E3D32',
    '--text-primary': '#F8F8F2',
    '--text-secondary': '#A6A599',
    '--text-muted': '#75715E',
    '--border-color': '#49483E',
    '--accent-primary': '#A6E22E',
    '--accent-hover': '#B8F340',
    '--danger': '#F92672',
    '--warning': '#FD971F',
    '--success': '#A6E22E',
    '--info': '#66D9EF',
    '--scrollbar-thumb': '#49483E',
    '--scrollbar-track': '#272822',
    '--acrylic-bg': 'rgba(39, 40, 34, 0.85)',
    '--acrylic-blur': '20px',
    '--shadow': '0 2px 8px rgba(0,0,0,0.4)',
  },
};
