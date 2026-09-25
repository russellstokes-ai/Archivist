export type ThemeMode = 'system' | 'light' | 'dark';

export type Palette = {
  ink: string;
  paper: string;
  muted: string;
  line: string;
  card: string;
  raised: string;
  sage: string;
  gold: string;
  ivory: string;
  danger: string;
  success: string;
};

export const brand = {
  ink: '#0F2A36',
  sage: '#397076',
  gold: '#C6A374',
  ivory: '#F8F7F2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typeScale = {
  caption: 12,
  body: 15,
  bodyLarge: 17,
  title: 24,
  display: 34,
} as const;

export const motion = {
  quick: 120,
  standard: 200,
  deliberate: 320,
} as const;

export const minimumTouchTarget = 48;

export function palette(mode: ThemeMode, system: string | null | undefined): Palette {
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return {
    ink: dark ? brand.ivory : brand.ink,
    paper: dark ? '#081318' : brand.ivory,
    muted: dark ? '#9FB3B0' : '#627672',
    line: dark ? '#203840' : '#D9DFDC',
    card: dark ? '#0D2027' : '#FFFDFA',
    raised: dark ? '#132B34' : '#FFFFFF',
    sage: brand.sage,
    gold: brand.gold,
    ivory: brand.ivory,
    danger: dark ? '#E6A3A3' : '#9F3D3D',
    success: dark ? '#8ED0AD' : '#247347',
  };
}
