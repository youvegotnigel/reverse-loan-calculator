import { Platform, useColorScheme, type TextStyle } from 'react-native';

/** Ceylon Note palette — mirrors apps/web/src/styles/tokens.css. */
const light = {
  ceylon950: '#0A2E2C',
  ceylon700: '#155E56',
  saffron: '#D99A2B',
  saffronText: '#E5B75C', // only ever used on ceylon950
  paper: '#F7F4EE',
  surface: '#FFFFFF',
  ink900: '#1C2B29',
  ink500: '#5B6E6A',
  line: '#E3DED2',
  positive: '#1E7A46',
  negative: '#B3382E',
};

const dark: typeof light = {
  ...light,
  ceylon700: '#2E8C7F',
  saffron: '#E5B75C',
  paper: '#0D1716',
  surface: '#14211F',
  ink900: '#E9EFEC',
  ink500: '#93A5A0',
  line: '#243230',
  positive: '#4FAE7C',
  negative: '#D4695F',
};

export type Theme = typeof light & { dark: boolean };

export function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  return { ...(isDark ? dark : light), dark: isDark };
}

export const radius = { s: 8, m: 14, l: 20 } as const;

export const fonts = {
  /** Fraunces stand-in until the real font ships (M2). */
  display: Platform.select({ ios: 'Georgia', default: 'serif' }) as string,
  ui: Platform.select({ ios: 'System', default: 'sans-serif' }) as string,
};

/** Tabular numerals so figures don't jitter as they change. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
