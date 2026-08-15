import { Theme } from '../types/theme';
import { jetbrainsDark } from './jetbrains-dark';
import { oneDark } from './one-dark';
import { monokai } from './monokai';
import { nord } from './nord';
import { solarizedDark } from './solarized-dark';
import { githubDark } from './github-dark';
import { highContrastDark } from './high-contrast-dark';
import { highContrastLight } from './high-contrast-light';

export const themes: Theme[] = [
  jetbrainsDark,
  oneDark,
  monokai,
  nord,
  solarizedDark,
  githubDark,
  highContrastDark,
  highContrastLight,
];

export function getThemeById(id: string): Theme {
  return themes.find(t => t.id === id) || jetbrainsDark;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(key, value);
  }
  // Accessibility themes scale the entire UI (Chromium zoom)
  const scale = theme.fontScale || 1;
  document.body.style.zoom = scale === 1 ? '' : String(scale);
  localStorage.setItem('ccm-theme', theme.id);
}

export function getSavedTheme(): Theme {
  const savedId = localStorage.getItem('ccm-theme');
  return savedId ? getThemeById(savedId) : jetbrainsDark;
}

export { jetbrainsDark };
export type { Theme };
