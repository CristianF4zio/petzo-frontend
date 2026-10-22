import { router } from 'expo-router';
import { ArrowLeft, BadgeCheck, ChevronDown, CircleAlert, X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius, shadow, type } from '@/lib/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, icon: Icon, style }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'text' && styles.buttonText,
        primary && { backgroundColor: disabled ? color.brandDisabled : pressed ? color.brandPressed : color.brand },
        variant === 'secondary' && pressed && { backgroundColor: color.soft },
        style,
      ]}
    >
      {Icon ? <Icon size={20} color={primary ? color.canvas : color.ink} /> : null}
      <Text style={[styles.buttonLabel, primary && { color: color.canvas }, variant === 'text' && styles.underline]}>{label}</Text>
    </Pressable>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.row4}>
      <CircleAlert size={16} color={color.error} />
      <Text style={[type.caption, { color: color.error, flex: 1 }]}>{message}</Text>
    </View>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={type.label}>{label}</Text>
      {children}
      <FieldError message={error} />
    </View>
  );
}

export function Input({ error, style, ...props }: TextInputProps & { error?: boolean }) {
  return (
    <TextInput
      placeholderTextColor={color.muted}
      style={[styles.input, error && { borderColor: color.error }, style]}
      {...props}
    />
  );
}

// Looks like an input, opens a sheet (zone, age)
export function SelectButton({ value, placeholder, onPress, icon: Icon, error }: { value?: string; placeholder: string; onPress: () => void; icon?: LucideIcon; error?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.input, styles.select, error && { borderColor: color.error }]}>
      {Icon ? <Icon size={20} color={color.muted} /> : null}
      <Text style={[type.body, { flex: 1, color: value ? color.ink : color.muted }]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <ChevronDown size={20} color={color.ink} />
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentLabel, on && { fontFamily: font.semibold, color: color.ink }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress, icon: Icon, count }: { label: string; on?: boolean; onPress: () => void; icon?: LucideIcon; count?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={styles.chipHit}>
      <View style={[styles.chip, on && styles.chipOn]}>
        {Icon ? <Icon size={16} color={color.ink} /> : null}
        <Text style={[styles.chipLabel, on && { fontFamily: font.semibold }]} numberOfLines={1}>
          {label}
        </Text>
        {count ? (
          <View style={styles.count}>
            <Text style={[type.badge, { color: color.canvas }]}>{count}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[type.badge, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function VerifiedBadge() {
  return (
    <View style={styles.verified}>
      <BadgeCheck size={14} color={color.verified} />
      <Text style={[type.badge, { color: color.verified }]}>Fundación verificada</Text>
    </View>
  );
}

export function IconCircle({ icon: Icon, size = 64 }: { icon: LucideIcon; size?: number }) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size }]}>
      <Icon size={size * 0.44} color={color.ink} />
    </View>
  );
}

// Empty, error and offline states share this layout
export function StateView({ icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.state}>
      <IconCircle icon={icon} />
      <Text style={[type.h2, { marginTop: 8, textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[type.body, { textAlign: 'center' }]}>{body}</Text> : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

export function Skeleton({ style }: { style: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: color.strong, borderRadius: radius.sm, opacity }, style]} />;
}

export function Header({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack ?? (() => router.back())} style={styles.iconButton}>
        <ArrowLeft size={24} color={color.ink} />
      </Pressable>
      {title ? <Text style={type.title}>{title}</Text> : null}
    </View>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: 12 + bottom }]}>{children}</View>;
}

export function Sheet({ visible, title, onClose, children, footer }: { visible: boolean; title?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Pressable accessibilityLabel="Cerrar" style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]} />
        </Pressable>
        <View style={[styles.sheet, !footer && { paddingBottom: bottom }]} accessibilityViewIsModal>
          {title ? (
            <View style={styles.sheetHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={[styles.iconButton, styles.sheetClose]}>
                <X size={22} color={color.ink} />
              </Pressable>
              <Text style={type.title}>{title}</Text>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { paddingBottom: 12 + bottom }]}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

// Single-choice list in a sheet (municipio, edad)
export function OptionSheet({ visible, title, options, value, onPick, onClose }: { visible: boolean; title: string; options: { value: string; label: string }[]; value: string; onPick: (v: string) => void; onClose: () => void }) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <View accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                onPick(o.value);
                onClose();
              }}
              style={styles.option}
            >
              <Text style={[type.body, { color: color.ink, fontFamily: on ? font.semibold : font.regular }]}>{o.label}</Text>
              <View style={[styles.radio, on && styles.radioOn]} />
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

export const styles = StyleSheet.create({
  button: { height: 48, borderRadius: radius.sm, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonSecondary: { backgroundColor: color.canvas, borderWidth: 1, borderColor: color.ink },
  buttonText: { paddingHorizontal: 4, alignSelf: 'flex-start' },
  buttonLabel: { fontFamily: font.medium, fontSize: 16, color: color.ink },
  underline: { textDecorationLine: 'underline' },
  row4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  field: { gap: 8 },
  input: { height: 48, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.sm, paddingHorizontal: 12, fontFamily: font.regular, fontSize: 16, color: color.ink, backgroundColor: color.canvas },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segmented: { flexDirection: 'row', backgroundColor: color.strong, borderRadius: radius.full, padding: 4, gap: 4 },
  segment: { flex: 1, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  segmentOn: { backgroundColor: color.canvas, borderColor: color.hairline },
  segmentLabel: { fontFamily: font.medium, fontSize: 14, color: color.body },
  chipHit: { height: 48, justifyContent: 'center' },
  chip: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.canvas },
  chipOn: { borderColor: color.ink, backgroundColor: color.strong },
  chipLabel: { fontFamily: font.regular, fontSize: 14, color: color.ink },
  count: { minWidth: 20, height: 20, borderRadius: radius.full, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  pill: { alignSelf: 'flex-start', height: 24, paddingHorizontal: 10, borderRadius: radius.full, justifyContent: 'center' },
  verified: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 8, borderWidth: 1, borderColor: color.verified, borderRadius: radius.full },
  iconCircle: { borderRadius: radius.full, backgroundColor: color.strong, alignItems: 'center', justifyContent: 'center' },
  state: { paddingVertical: 64, paddingHorizontal: 32, alignItems: 'center', gap: 12 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.hairline, backgroundColor: color.canvas },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: color.canvas, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, maxHeight: '90%', ...shadow },
  sheetHeader: { height: 56, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: color.hairline },
  sheetClose: { position: 'absolute', left: 4 },
  sheetBody: { padding: 16, gap: 24 },
  option: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: color.hairline },
  radio: { width: 22, height: 22, borderRadius: radius.full, borderWidth: 2, borderColor: color.hairline },
  radioOn: { borderWidth: 7, borderColor: color.ink },
});
