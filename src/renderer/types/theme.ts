export interface Theme {
  id: string;
  name: { zh: string; en: string };
  colors: Record<string, string>;
  /** Optional UI scale factor for accessibility themes (default 1) */
  fontScale?: number;
}
