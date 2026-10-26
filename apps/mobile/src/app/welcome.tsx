import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Mail, PawPrint } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { AccessibilityInfo, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Contact, Find, Reviewed } from '@/components/illustrations/Onboarding';
import { Button } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { color, font, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

type Slide = { title: string; body: string; Art: ComponentType<{ width: number; height: number }> };

const SLIDES: Slide[] = [
  { title: 'Encuentra a tu mejor amigo', body: 'Perros y gatos que buscan hogar en Gran Caracas, cerca de ti.', Art: Find },
  { title: 'Publicaciones revisadas', body: 'Nuestra IA modera cada publicación para evitar fraudes y ventas.', Art: Reviewed },
  { title: 'Contacto seguro', body: 'El WhatsApp del publicador solo aparece cuando aprueba tu solicitud.', Art: Contact },
];

// Soft blobs + paws behind the art; decorative
const PAWS = [
  { top: '18%', left: '8%', size: 22, rotate: '-20deg' },
  { top: '30%', right: '6%', size: 28, rotate: '18deg' },
  { top: '58%', left: '4%', size: 18, rotate: '12deg' },
  { top: '66%', right: '10%', size: 20, rotate: '-14deg' },
] as const;

function Pattern() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.blob, { width: 260, height: 260, top: -60, left: -90 }]} />
      <View style={[styles.blob, { width: 200, height: 200, top: '40%', right: -80 }]} />
      {PAWS.map(({ size, rotate, ...pos }, i) => (
        <PawPrint key={i} size={size} color="rgba(255,255,255,0.22)" style={[styles.paw, pos, { transform: [{ rotate }] }]} />
      ))}
    </View>
  );
}

export default function Welcome() {
  const say = useToast();
  const { signInWithGoogle } = useSession();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [idx, setIdx] = useState(0);
  const [artBox, setArtBox] = useState(0);
  const [reduce, setReduce] = useState(false);
  const pager = useRef<FlatList<Slide>>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce, () => setReduce(false));
  }, []);

  // Art keeps its 320:360 ratio and fits the hero on short screens
  const artW = Math.min(width - 32, 340, (artBox * 320) / 360);

  const google = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      say(e instanceof ApiError && e.code === 'OFFLINE' ? e.message : 'No pudimos entrar con Google. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const slide = SLIDES[idx];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.hero, { paddingTop: top + 8 }]}>
        <Pattern />
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <View style={styles.logoMark}>
              <PawPrint size={16} color={color.canvas} />
            </View>
            <Text style={styles.logoText}>Petzo</Text>
          </View>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <Pressable
                key={s.title}
                accessibilityRole="button"
                accessibilityLabel={`Página ${i + 1} de ${SLIDES.length}`}
                accessibilityState={{ selected: i === idx }}
                onPress={() => {
                  pager.current?.scrollToIndex({ index: i, animated: !reduce });
                  setIdx(i);
                }}
                style={styles.dotHit}
              >
                <View style={[styles.pageDot, i === idx && styles.pageDotOn]} />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.pagerWrap} onLayout={(e) => setArtBox(e.nativeEvent.layout.height)}>
          <FlatList
            ref={pager}
            data={SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(s) => s.title}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={[styles.slide, { width }]}>
                {artW > 0 ? <item.Art width={artW} height={(artW * 360) / 320} /> : null}
              </View>
            )}
            style={styles.pager}
          />
        </View>
      </View>

      <View style={[styles.card, { paddingBottom: bottom + 16 }]}>
        <Text style={type.h1} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header">
          {slide.title}
        </Text>
        <Text style={[type.body, styles.text]} numberOfLines={3}>
          {slide.body}
        </Text>
        <Button label={busy ? 'Abriendo Google…' : 'Continuar con Google'} onPress={google} disabled={busy} />
        <Button label="Entrar con correo" variant="secondary" icon={Mail} onPress={() => router.push('/auth')} />
        <Text style={[type.caption, { textAlign: 'center', marginTop: 4 }]}>Al continuar aceptas los Términos y la Política de privacidad.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.hero },
  hero: { flex: 1, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: font.bold, fontSize: 18, color: color.canvas },
  dots: { flexDirection: 'row' },
  dotHit: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pageDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.5)' },
  pageDotOn: { width: 24, backgroundColor: color.canvas },
  pagerWrap: { flex: 1, marginTop: 8 },
  pager: { flex: 1 },
  slide: { justifyContent: 'flex-end', alignItems: 'center' },
  blob: { position: 'absolute', borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.08)' },
  paw: { position: 'absolute' },
  card: { backgroundColor: color.canvas, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -32, paddingHorizontal: 24, paddingTop: 28, gap: 12 },
  text: { color: color.muted, minHeight: 48, marginBottom: 8 },
});
