import { router } from 'expo-router';
import { ArrowLeft, BadgeCheck, ChevronDown, CircleAlert, X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'text';
  disabled?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

// 'text' is the old name of 'ghost'
export function Button({ label, onPress, variant = 'primary', disabled, icon: Icon, style }: ButtonProps) {
  const primary = variant === 'primary';
  const ghost = variant === 'ghost' || variant === 'text';
  const fg = disabled ? color.muted : primary ? color.canvas : ghost ? color.brandText : variant === 'danger' ? color.error : color.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        ghost ? styles.buttonGhost : !primary && styles.buttonSecondary,
        primary && { backgroundColor: disabled ? color.sand : pressed ? color.inkPressed : color.ink },
        !primary && !ghost && pressed && { backgroundColor: color.cream },
        pressed && styles.pressed,
        style,
      ]}
    >
      {Icon ? <Icon size={20} color={fg} /> : null}
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
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

// White on cream screens; `fill` = sand on white cards and sheets
export function Input({ error, fill, style, onFocus, onBlur, ...props }: TextInputProps & { error?: boolean; fill?: boolean }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={color.muted}
      cursorColor={color.brand}
      selectionColor={color.brand}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        onBlur?.(e);
      }}
      style={[styles.input, fill && styles.inputFill, error && { borderColor: color.error }, focus && styles.inputFocus, style]}
      {...props}
    />
  );
}

// Looks like an input, opens a sheet (zone, age)
export function SelectButton({ value, placeholder, onPress, icon: Icon, error, fill }: { value?: string; placeholder: string; onPress: () => void; icon?: LucideIcon; error?: boolean; fill?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.input, styles.select, fill && styles.inputFill, error && { borderColor: color.error }, pressed && { borderColor: color.brand }]}
    >
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
      {({ pressed }) => (
        <View style={[styles.chip, on && styles.chipOn, pressed && styles.pressed]}>
          {Icon ? <Icon size={16} color={on ? color.canvas : color.ink} /> : null}
          <Text style={[styles.chipLabel, on && styles.chipLabelOn]} numberOfLines={1}>
            {label}
          </Text>
          {count ? (
            <View style={styles.count}>
              <Text style={[type.badge, { color: color.canvas }]}>{count}</Text>
            </View>
          ) : null}
        </View>
      )}
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
      <BadgeCheck size={14} color={color.success} />
      <Text style={[type.badge, { color: color.success }]}>Fundación verificada</Text>
    </View>
  );
}

export function IconCircle({ icon: Icon, size = 72, bg = color.peach, tint = color.brand }: { icon: LucideIcon; size?: number; bg?: string; tint?: string }) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, backgroundColor: bg }]}>
      <Icon size={size * 0.42} color={tint} />
    </View>
  );
}

// Empty, error and offline states share this layout
export function StateView({ icon, title, body, action, bg, tint }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode; bg?: string; tint?: string }) {
  return (
    <View style={styles.state}>
      <IconCircle icon={icon} size={88} bg={bg} tint={tint} />
      <Text style={[type.h2, { marginTop: 8, textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[type.body, styles.stateBody]}>{body}</Text> : null}
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
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
  return <Animated.View style={[{ backgroundColor: color.sand, borderRadius: radius.sm, opacity }, style]} />;
}

// White circle icon button (soft shadow) with a 48pt hit area
export function RoundButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      {({ pressed }) => <View style={[styles.round, pressed && styles.pressed]}>{children}</View>}
    </Pressable>
  );
}

export function Header({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <RoundButton label="Volver" onPress={onBack ?? (() => router.back())}>
        <ArrowLeft size={20} color={color.ink} />
      </RoundButton>
      <Text style={[type.title, styles.headerTitle]} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {right ?? <View style={styles.iconButton} />}
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
      <KeyboardAvoidingView style={styles.sheetRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityLabel="Cerrar" style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]} />
        </Pressable>
        <View style={[styles.sheet, !footer && { paddingBottom: bottom }]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          {title ? (
            <View style={styles.sheetHeader}>
              <Text style={[type.h2, { flex: 1 }]} accessibilityRole="header">
                {title}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.iconButton}>
                {({ pressed }) => (
                  <View style={[styles.sheetClose, pressed && styles.pressed]}>
                    <X size={20} color={color.ink} />
                  </View>
                )}
              </Pressable>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { paddingBottom: 12 + bottom }]}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  button: { height: 52, borderRadius: radius.full, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonSecondary: { backgroundColor: color.canvas, borderWidth: 1, borderColor: color.hairline },
  buttonGhost: { height: 44, paddingHorizontal: 8, alignSelf: 'flex-start' },
  buttonLabel: { fontFamily: font.semibold, fontSize: 16 },
  row4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  field: { gap: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, paddingHorizontal: 16, fontFamily: font.regular, fontSize: 16, color: color.ink, backgroundColor: color.canvas },
  inputFill: { backgroundColor: color.sand, borderColor: color.sand },
  inputFocus: { borderWidth: 2, borderColor: color.brand, paddingHorizontal: 15 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segmented: { flexDirection: 'row', backgroundColor: color.sand, borderRadius: radius.full, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segmentOn: { backgroundColor: color.canvas, ...shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segmentLabel: { fontFamily: font.medium, fontSize: 14, color: color.body, textAlign: 'center' },
  chipHit: { minHeight: 48, justifyContent: 'center' },
  chip: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: color.canvas, borderWidth: 1, borderColor: color.hairline },
  chipOn: { backgroundColor: color.ink, borderColor: color.ink },
  chipLabel: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  chipLabelOn: { fontFamily: font.semibold, color: color.canvas },
  count: { minWidth: 20, height: 20, borderRadius: radius.full, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  pill: { alignSelf: 'flex-start', height: 24, paddingHorizontal: 10, borderRadius: radius.full, justifyContent: 'center' },
  verified: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 10, backgroundColor: color.mint, borderRadius: radius.full },
  iconCircle: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  state: { paddingVertical: 56, paddingHorizontal: 32, alignItems: 'center', gap: 8 },
  stateBody: { textAlign: 'center', color: color.muted, maxWidth: 320 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  headerTitle: { flex: 1, textAlign: 'center' },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  round: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.hairline, backgroundColor: color.canvas },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: color.canvas, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '90%', ...shadow },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: radius.full, backgroundColor: color.hairline, marginTop: 10 },
  sheetHeader: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 20, paddingRight: 10 },
  sheetClose: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: color.sand, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 24 },
  option: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: color.hairline },
  radio: { width: 22, height: 22, borderRadius: radius.full, borderWidth: 2, borderColor: color.hairline },
  radioOn: { borderWidth: 7, borderColor: color.brand },
});
