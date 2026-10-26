import { PawPrint } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { color, font, radius, type } from '@/lib/theme';

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
              ? { opacity: 0.7 }
              : {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }],
                },
          ]}
        />
        <Animated.View style={[styles.logo, { opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
          <PawPrint size={48} color={color.canvas} strokeWidth={2.2} />
        </Animated.View>
      </View>
      {fonts ? (
        <>
          <Animated.Text style={[type.display, styles.word, rise(word)]}>Petzo</Animated.Text>
          <Animated.Text style={[styles.tag, rise(tag)]}>Adopción responsable en Caracas</Animated.Text>
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  mark: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 160, height: 160, borderRadius: radius.full, backgroundColor: color.peach },
  logo: { width: 96, height: 96, borderRadius: radius.lg, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center' },
  word: { marginTop: 8 },
  tag: { fontFamily: font.regular, fontSize: 16, lineHeight: 22, color: color.muted, marginTop: 4 },
});
