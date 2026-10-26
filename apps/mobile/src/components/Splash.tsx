import { PawPrint } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { color, font, radius, shadow, type } from '@/lib/theme';

type Props = { fonts: boolean; ready: boolean; onDone: () => void };

// Covers the app while fonts and session load; fades out once both are ready and the minimum time passed
export function Splash({ fonts, ready, onDone }: Props) {
  const [reduce, setReduce] = useState<boolean | null>(null);
  const [minDone, setMinDone] = useState(false);
  const logo = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce, () => setReduce(false));
  }, []);

  useEffect(() => {
    if (reduce === null) return;
    const t = setTimeout(() => setMinDone(true), reduce ? 600 : 1300);
    if (reduce) {
      logo.setValue(1);
      return () => clearTimeout(t);
    }
    Animated.spring(logo, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [reduce, logo, pulse]);

  // Text waits for DM Sans so it never flashes in the system font
  useEffect(() => {
    if (reduce === null || !fonts) return;
    if (reduce) {
      word.setValue(1);
      tag.setValue(1);
      return;
    }
    const ease = (v: Animated.Value) => Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.sequence([Animated.delay(150), Animated.stagger(150, [ease(word), ease(tag)])]).start();
  }, [reduce, fonts, word, tag]);

  const leaving = ready && minDone;
  useEffect(() => {
    if (!leaving) return;
    Animated.timing(fade, { toValue: 0, duration: reduce ? 150 : 250, useNativeDriver: true }).start(() => onDone());
  }, [leaving, reduce, fade, onDone]);

  const rise = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} pointerEvents={leaving ? 'none' : 'auto'} accessible accessibilityLabel="Cargando Petzo">
      <View style={styles.mark}>
        <Animated.View
          style={[
            styles.pulse,
            reduce
              ? { opacity: 0.35 }
              : {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.45] }) }],
                },
          ]}
        />
        <Animated.View style={[styles.logo, { opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
          <PawPrint size={52} color={color.brand} strokeWidth={2.4} />
        </Animated.View>
      </View>
      {fonts ? (
        <>
          <Animated.Text style={[type.display, styles.word, rise(word)]}>Petzo</Animated.Text>
          <Animated.View style={[styles.tagPill, rise(tag)]}>
            <Text style={styles.tag}>Adopción responsable en Caracas</Text>
          </Animated.View>
        </>
      ) : null}
    </Animated.View>
  );
}

// White on hero blue only for bold >= 24px; the tagline sits on a heroDeep pill to keep 4.5:1
const styles = StyleSheet.create({
  root: { backgroundColor: color.hero, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  mark: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 168, height: 168, borderRadius: radius.full, borderWidth: 3, borderColor: color.canvas, backgroundColor: color.heroDeep },
  logo: { width: 112, height: 112, borderRadius: radius.xl, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.18, elevation: 8 },
  word: { marginTop: 4, fontSize: 44, lineHeight: 52, color: color.canvas },
  tagPill: { marginTop: 12, backgroundColor: color.heroDeep, borderRadius: radius.full, paddingVertical: 8, paddingHorizontal: 16 },
  tag: { fontFamily: font.medium, fontSize: 15, lineHeight: 20, color: color.canvas },
});
