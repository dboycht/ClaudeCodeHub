import { Theme } from '../types/theme';

// 高对比暗色 — 面向低视力用户：纯黑背景、纯白文字、明黄强调色、放大字体
export const highContrastDark: Theme = {
  id: 'high-contrast-dark',
  name: { zh: '高对比暗色（护眼）', en: 'High Contrast Dark' },
  fontScale: 1.15,
  colors: {
    '--bg-primary': '#000000',
    '--bg-secondary': '#0A0A0A',
    '--bg-tertiary': '#141414',
    '--bg-hover': '#1F1F1F',
    '--text-primary': '#FFFFFF',
    '--text-secondary': '#E0E0E0',
    '--text-muted': '#B0B0B0',
    '--border-color': '#666666',
    '--accent-primary': '#FFD600',
    '--accent-hover': '#FFEE58',
    '--danger': '#FF5252',
    '--warning': '#FFD600',
    '--success': '#69F0AE',
    '--info': '#40C4FF',
    '--scrollbar-thumb': '#888888',
    '--scrollbar-track': '#000000',
    '--acrylic-bg': 'rgba(0, 0, 0, 0.92)',
    '--acrylic-blur': '20px',
    '--shadow': '0 2px 8px rgba(255,255,255,0.15)',
  },
};
