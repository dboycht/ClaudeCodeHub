import type { ColorLabel } from '../../shared/types';

export type { ColorLabel };

export const COLOR_LABELS: { id: ColorLabel; color: string; label: { zh: string; en: string } }[] = [
  { id: 'red', color: '#E74C3C', label: { zh: '红色', en: 'Red' } },
  { id: 'orange', color: '#E67E22', label: { zh: '橙色', en: 'Orange' } },
  { id: 'yellow', color: '#F1C40F', label: { zh: '黄色', en: 'Yellow' } },
  { id: 'green', color: '#2ECC71', label: { zh: '绿色', en: 'Green' } },
  { id: 'blue', color: '#3498DB', label: { zh: '蓝色', en: 'Blue' } },
  { id: 'purple', color: '#9B59B6', label: { zh: '紫色', en: 'Purple' } },
  { id: 'gray', color: '#95A5A6', label: { zh: '灰色', en: 'Gray' } },
];
