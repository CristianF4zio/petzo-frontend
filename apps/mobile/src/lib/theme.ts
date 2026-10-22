import { StyleSheet } from 'react-native';

// Tokens from docs/design/Petzo.dc.html
export const color = {
  brand: '#C2410C',
  brandPressed: '#9A3412',
  brandDisabled: '#FBD5C5',
  verified: '#0F766E',
  ink: '#222222',
  body: '#3F3F3F',
  muted: '#6A6A6A',
  canvas: '#FFFFFF',
  soft: '#F7F7F7',
  strong: '#F2F2F2',
  hairline: '#DDDDDD',
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

export const radius = { sm: 8, md: 14, full: 999 };

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
};

export const type = StyleSheet.create({
  h1: { fontFamily: font.semibold, fontSize: 22, lineHeight: 29, color: color.ink },
  h2: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26, color: color.ink },
  title: { fontFamily: font.semibold, fontSize: 16, lineHeight: 21, color: color.ink },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: color.body },
  label: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: color.ink },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: color.muted },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: color.muted },
  badge: { fontFamily: font.semibold, fontSize: 11, lineHeight: 13 },
});
