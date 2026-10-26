import { createContext, use, useCallback, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, radius, shadow, type } from './theme';

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = useCallback((m: string) => {
    setMessage(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2600);
  }, []);

  return (
    <ToastContext value={say}>
      {children}
      {message ? (
        <View accessibilityRole="alert" style={styles.toast} pointerEvents="none">
          <Text style={[type.label, styles.text]}>{message}</Text>
        </View>
      ) : null}
    </ToastContext>
  );
}

export const useToast = () => use(ToastContext);

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 20, right: 20, bottom: 100, backgroundColor: color.ink, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, ...shadow, shadowOpacity: 0.2 },
  text: { color: color.canvas },
});
