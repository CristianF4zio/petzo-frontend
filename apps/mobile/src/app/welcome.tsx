import { router } from 'expo-router';
import { Cat, Dog, Lock, Mail, MessageCircle, PawPrint, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { color, font, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

type Slide = { title: string; body: string; main: LucideIcon; side: LucideIcon; bg: string };

const SLIDES: Slide[] = [
  { title: 'Encuentra a tu mejor amigo', body: 'Perros y gatos que buscan hogar en Gran Caracas, cerca de ti.', main: Dog, side: Cat, bg: color.sky },
  { title: 'Publicaciones revisadas', body: 'Nuestra IA modera cada publicación para evitar fraudes y ventas.', main: ShieldCheck, side: Sparkles, bg: color.mint },
  { title: 'Contacto seguro', body: 'El WhatsApp del publicador solo aparece cuando aprueba tu solicitud.', main: MessageCircle, side: Lock, bg: color.butter },
];

const ART = 260;

// Pastel circles + lucide glyphs; decorative, the card text carries the meaning
function Illustration({ slide }: { slide: Slide }) {
  const { main: Main, side: Side } = slide;
  return (
    <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.big, { backgroundColor: slide.bg }]}>
        <Main size={96} color={color.ink} strokeWidth={1.6} />
      </View>
      <View style={[styles.bubble, styles.bubbleTop]}>
        <Side size={34} color={color.brand} />
      </View>
      <View style={[styles.bubble, styles.bubbleBottom]}>
        <PawPrint size={26} color={color.brand} />
      </View>
      <View style={[styles.dot, { top: 34, left: 40, backgroundColor: color.butter }]} />
      <View style={[styles.dot, { bottom: 24, right: 46, width: 14, height: 14, backgroundColor: color.sky }]} />
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
  const pager = useRef<FlatList<Slide>>(null);

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
      <View style={[styles.hero, { paddingTop: top + 8 }]}>
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
                  pager.current?.scrollToIndex({ index: i });
                  setIdx(i);
                }}
                style={styles.dotHit}
              >
                <View style={[styles.pageDot, i === idx && styles.pageDotOn]} />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.pagerWrap}>
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
              <View style={{ width, alignItems: 'center' }}>
                <Illustration slide={item} />
              </View>
            )}
            style={{ flexGrow: 0 }}
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
  root: { flex: 1, backgroundColor: color.peach },
  hero: { flex: 1, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: font.bold, fontSize: 18, color: color.ink },
  dots: { flexDirection: 'row' },
  dotHit: { width: 28, height: 44, alignItems: 'center', justifyContent: 'center' },
  pageDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: 'rgba(28,28,30,0.25)' },
  pageDotOn: { width: 22, backgroundColor: color.ink },
  pagerWrap: { flex: 1, justifyContent: 'center' },
  art: { width: ART, height: ART, alignItems: 'center', justifyContent: 'center' },
  big: { width: 200, height: 200, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', borderRadius: radius.full, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center' },
  bubbleTop: { top: 8, right: 8, width: 76, height: 76 },
  bubbleBottom: { bottom: 18, left: 12, width: 58, height: 58 },
  dot: { position: 'absolute', width: 20, height: 20, borderRadius: radius.full },
  card: { backgroundColor: color.canvas, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: -32, paddingHorizontal: 24, paddingTop: 28, gap: 12 },
  text: { color: color.muted, minHeight: 48, marginBottom: 8 },
});
