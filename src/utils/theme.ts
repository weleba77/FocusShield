// Design tokens for Focus Shield (Expo version)
export const Colors = {
  background: '#0A0E1A',
  surface: '#111827',
  surfaceElevated: '#1A2236',
  card: '#141B2D',
  cardBorder: 'rgba(99, 102, 241, 0.15)',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryGlow: 'rgba(99, 102, 241, 0.3)',
  accent: '#A855F7',
  accentLight: '#C084FC',
  teal: '#14B8A6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  gradientPrimary: ['#6366F1', '#A855F7'] as string[],
  gradientDark: ['#0A0E1A', '#111827'] as string[],
  gradientCard: ['#141B2D', '#1A2236'] as string[],
  gradientSuccess: ['#059669', '#10B981'] as string[],
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const BorderRadius = { sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999 };
export const Typography = {
  fontSize: { xs: 10, sm: 12, base: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32, display: 48 },
  fontWeight: {
    regular: '400' as const, medium: '500' as const, semibold: '600' as const,
    bold: '700' as const, extrabold: '800' as const, black: '900' as const,
  },
};
