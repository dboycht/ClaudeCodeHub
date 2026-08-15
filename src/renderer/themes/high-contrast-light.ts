import { Theme } from '../types/theme';

// 高对比亮色 — 面向低视力用户：纯白背景、纯黑文字、深蓝强调色、放大字体
export const highContrastLight: Theme = {
  id: 'high-contrast-light',
  name: { zh: '高对比亮色（护眼）', en: 'High Contrast Light' },
  fontScale: 1.15,
  colors: {
    '--bg-primary': '#FFFFFF',
    '--bg-secondary': '#F5F5F5',
    '--bg-tertiary': '#EBEBEB',
    '--bg-hover': '#E0E0E0',
    '--text-primary': '#000000',
    '--text-secondary': '#1A1A1A',
    '--text-muted': '#404040',
    '--border-color': '#666666',
    '--accent-primary': '#0000CC',
    '--accent-hover': '#0000EE',
    '--danger': '#CC0000',
    '--warning': '#8A6D00',
    '--success': '#006600',
    '--info': '#0000CC',
    '--scrollbar-thumb': '#888888',
    '--scrollbar-track': '#FFFFFF',
    '--acrylic-bg': 'rgba(255, 255, 255, 0.92)',
    '--acrylic-blur': '20px',
    '--shadow': '0 2px 8px rgba(0,0,0,0.25)',
  },
};
