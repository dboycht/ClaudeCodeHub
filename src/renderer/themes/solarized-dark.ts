import { Theme } from '../types/theme';

export const solarizedDark: Theme = {
  id: 'solarized-dark',
  name: { zh: 'Solarized 暗色', en: 'Solarized Dark' },
  colors: {
    '--bg-primary': '#002B36',
    '--bg-secondary': '#073642',
    '--bg-tertiary': '#0A4A5A',
    '--bg-hover': '#0D5468',
    '--text-primary': '#839496',
    '--text-secondary': '#657B83',
    '--text-muted': '#586E75',
    '--border-color': '#094B5B',
    '--accent-primary': '#268BD2',
    '--accent-hover': '#379DE5',
    '--danger': '#DC322F',
    '--warning': '#B58900',
    '--success': '#859900',
    '--info': '#2AA198',
    '--scrollbar-thumb': '#094B5B',
    '--scrollbar-track': '#002B36',
    '--acrylic-bg': 'rgba(0, 43, 54, 0.85)',
    '--acrylic-blur': '20px',
    '--shadow': '0 2px 8px rgba(0,0,0,0.35)',
  },
};
