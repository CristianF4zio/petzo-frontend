import { CircleAlert, Eye, EyeOff, PawPrint } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Header, Input, Segmented } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { color, radius, shadow, type } from '@/lib/theme';

type Mode = 'login' | 'register';
type Errors = Partial<Record<'nombre' | 'correo' | 'pass' | 'form', string>>;

function authMessage(e: unknown) {
  if (!(e instanceof ApiError)) return 'No pudimos continuar. Intenta de nuevo.';
  if (e.code === 'INVALID_CREDENTIALS') return 'Correo o contraseña incorrectos.';
  if (e.code === 'EMAIL_TAKEN') return 'Ya existe una cuenta con ese correo. Entra con tu contraseña.';
  if (e.code === 'OFFLINE') return e.message;
  return 'No pudimos continuar. Intenta de nuevo.';
}

export default function Auth() {
  const { signIn, register } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Errors = {};
    if (mode === 'register' && !nombre.trim()) e.nombre = 'Escribe tu nombre.';
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) e.correo = correo ? 'Ese correo no parece válido. Revisa que tenga @ y dominio.' : 'Escribe tu correo.';
    if (pass.length < 8) e.pass = 'La contraseña debe tener al menos 8 caracteres.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      // On success the session guard in _layout swaps to the app
      if (mode === 'login') await signIn(correo.trim(), pass);
      else await register(nombre.trim(), correo.trim(), pass);
    } catch (err) {
      const f = err instanceof ApiError ? err.fields : undefined;
      setErrors({ nombre: f?.fullName, correo: f?.email, pass: f?.password, form: f?.fullName || f?.email || f?.password ? undefined : authMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Header />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 4 }}>
            <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <PawPrint size={30} color={color.brand} strokeWidth={2.4} />
            </View>
            <Text style={[type.h1, styles.title]} accessibilityRole="header">
              {mode === 'login' ? 'Entra a Petzo' : 'Crea tu cuenta'}
            </Text>
            <Text style={type.small}>{mode === 'login' ? 'Qué bueno verte de nuevo.' : 'Solo toma un minuto.'}</Text>
          </View>
          <Segmented
            options={[
              { value: 'login', label: 'Entrar' },
              { value: 'register', label: 'Crear cuenta' },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setErrors({});
            }}
          />
          {mode === 'register' ? (
            <Field label="Nombre" error={errors.nombre}>
              <Input value={nombre} onChangeText={setNombre} placeholder="Como quieres que te vean" error={!!errors.nombre} autoComplete="name" />
            </Field>
          ) : null}
          <Field label="Correo" error={errors.correo}>
            <Input
              value={correo}
              onChangeText={setCorreo}
              placeholder="tucorreo@gmail.com"
              error={!!errors.correo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </Field>
          <Field label="Contraseña" error={errors.pass}>
            <View>
              <Input
                value={pass}
                onChangeText={setPass}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry={!show}
                error={!!errors.pass}
                style={{ paddingRight: 48 }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setShow(!show)} style={styles.eye}>
                {show ? <EyeOff size={20} color={color.muted} /> : <Eye size={20} color={color.muted} />}
              </Pressable>
            </View>
          </Field>
          {errors.form ? (
            <View style={styles.formError} accessibilityRole="alert">
              <CircleAlert size={18} color={color.error} />
              <Text style={[type.small, { color: color.error, flex: 1 }]}>{errors.form}</Text>
            </View>
          ) : null}
          <Button label={busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'} onPress={submit} disabled={busy} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 20 },
  logo: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadow },
  title: { fontSize: 32, lineHeight: 38 },
  formError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.errorBg, borderRadius: radius.md, padding: 12 },
  eye: { position: 'absolute', right: 2, top: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
