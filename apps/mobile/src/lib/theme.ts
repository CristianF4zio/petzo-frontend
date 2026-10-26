import { StyleSheet } from 'react-native';

// White canvas, ink pill CTAs, brand orange accents, pastel surfaces
export const color = {
  brand: '#C2410C',
  brandPressed: '#9A3412',
  brandDisabled: '#FBD5C5',
  verified: '#0F766E',
  ink: '#1C1C1E',
  inkPressed: '#3A3A3C',
  body: '#3F3F3F',
  muted: '#6B6B6B',
  canvas: '#FFFFFF',
  soft: '#F5F5F4',
  strong: '#EDEBEA',
  hairline: '#E7E5E4',
  peach: '#FFE8D6',
  sky: '#DCEBFA',
  mint: '#DDF3E8',
  butter: '#FEF3C7',
  error: '#B91C1C',
  errorBg: '#FEE2E2',
  scrim: 'rgba(0,0,0,0.5)',
};

export const font = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
};

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, full: 999 };

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
};

export const type = StyleSheet.create({
  display: { fontFamily: font.bold, fontSize: 36, lineHeight: 42, color: color.ink },
  h1: { fontFamily: font.bold, fontSize: 26, lineHeight: 32, color: color.ink },
  h2: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26, color: color.ink },
  title: { fontFamily: font.semibold, fontSize: 16, lineHeight: 21, color: color.ink },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: color.body },
  label: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: color.ink },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: color.muted },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: color.muted },
  badge: { fontFamily: font.semibold, fontSize: 11, lineHeight: 13 },
});
