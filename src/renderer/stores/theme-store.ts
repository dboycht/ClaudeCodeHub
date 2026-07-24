import { create } from 'zustand';
import { Theme, getSavedTheme, getThemeById, applyTheme, themes } from '../themes';

interface ThemeState {
  current: Theme;
  allThemes: Theme[];
  language: 'zh-CN' | 'en-US';

  setTheme: (id: string) => void;
  setLanguage: (lang: 'zh-CN' | 'en-US') => void;
  toggleLanguage: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  current: getSavedTheme(),
  allThemes: themes,
  language: (localStorage.getItem('ccm-language') as 'zh-CN' | 'en-US') || 'zh-CN',

  setTheme: (id: string) => {
    const theme = getThemeById(id);
    applyTheme(theme);
    set({ current: theme });
  },

  setLanguage: (lang: 'zh-CN' | 'en-US') => {
    localStorage.setItem('ccm-language', lang);
    set({ language: lang });
  },

  toggleLanguage: () => {
    const next = get().language === 'zh-CN' ? 'en-US' : 'zh-CN';
    localStorage.setItem('ccm-language', next);
    set({ language: next });
  },
}));
