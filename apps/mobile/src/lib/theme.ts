import { StyleSheet } from 'react-native';

// Palette from design-system/petzo/MASTER.md ("Pet Tech App": playful orange + trust blue); shared with the admin panel
export const color = {
  brand: '#EA580C',
  brandText: '#C2410C',
  brandSoft: '#FFEDD5',
  trust: '#2563EB',
  hero: '#5B8DEF',
  heroDeep: '#3B6FD8',
  verified: '#15803D',
  ink: '#1C1917',
  inkPressed: '#44403C',
  body: '#44403C',
  muted: '#57534E',
  canvas: '#FFFFFF',
  cream: '#FFF7ED',
  sand: '#F5EFE8',
  hairline: '#EADFD3',
  peach: '#FFEDD5',
  sky: '#DBEAFE',
  mint: '#DCFCE7',
  butter: '#FEF3C7',
  lilac: '#EDE9FE',
  success: '#15803D',
  error: '#B91C1C', // 5.5:1 on errorBg (#DC2626 was 3.9:1)
  errorBg: '#FEE2E2',
  scrim: 'rgba(28,25,23,0.5)',
};

export const font = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
};

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, full: 999 };

// Claymorphism-lite: soft warm shadow, white cards on cream
export const shadow = {
  shadowColor: '#1C1917',
  shadowOpacity: 0.06,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
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
  badge: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16 },
});
