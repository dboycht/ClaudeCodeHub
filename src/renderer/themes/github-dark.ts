import { Theme } from '../types/theme';

export const githubDark: Theme = {
  id: 'github-dark',
  name: { zh: 'GitHub 暗色', en: 'GitHub Dark' },
  colors: {
    '--bg-primary': '#0D1117',
    '--bg-secondary': '#161B22',
    '--bg-tertiary': '#21262D',
    '--bg-hover': '#30363D',
    '--text-primary': '#C9D1D9',
    '--text-secondary': '#8B949E',
    '--text-muted': '#6E7681',
    '--border-color': '#30363D',
    '--accent-primary': '#58A6FF',
    '--accent-hover': '#79C0FF',
    '--danger': '#F85149',
    '--warning': '#D29922',
    '--success': '#3FB950',
    '--info': '#58A6FF',
    '--scrollbar-thumb': '#30363D',
    '--scrollbar-track': '#0D1117',
    '--acrylic-bg': 'rgba(13, 17, 23, 0.85)',
    '--acrylic-blur': '20px',
    '--shadow': '0 2px 8px rgba(0,0,0,0.5)',
  },
};
