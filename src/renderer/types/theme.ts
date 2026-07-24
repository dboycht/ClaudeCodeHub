export interface Theme {
  id: string;
  name: { zh: string; en: string };
  colors: Record<string, string>;
}
