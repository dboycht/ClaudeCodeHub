import { Theme } from '../types/theme';

export const nord: Theme = {
  id: 'nord',
  name: { zh: 'Nord', en: 'Nord' },
  colors: {
    '--bg-primary': '#2E3440',
    '--bg-secondary': '#353C4A',
    '--bg-tertiary': '#3B4252',
    '--bg-hover': '#434C5E',
    '--text-primary': '#D8DEE9',
    '--text-secondary': '#9CA9BF',
    '--text-muted': '#6E7C94',
    '--border-color': '#4C566A',
    '--accent-primary': '#88C0D0',
    '--accent-hover': '#8FCFDE',
    '--danger': '#BF616A',
    '--warning': '#EBCB8B',
    '--success': '#A3BE8C',
    '--info': '#81A1C1',
    '--scrollbar-thumb': '#4C566A',
    '--scrollbar-track': '#2E3440',
    '--acrylic-bg': 'rgba(46, 52, 64, 0.85)',
    '--acrylic-blur': '20px',
    '--shadow': '0 2px 8px rgba(0,0,0,0.3)',
  },
};
