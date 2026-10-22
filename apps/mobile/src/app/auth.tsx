import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Header, Input, Segmented } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { color, type } from '@/lib/theme';

type Mode = 'login' | 'register';
type Errors = Partial<Record<'nombre' | 'correo' | 'pass' | 'form', string>>;

function authMessage(message: string) {
  if (/invalid login/i.test(message)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(message)) return 'Ya existe una cuenta con ese correo. Entra con tu contraseña.';
  if (/network|fetch/i.test(message)) return 'Sin conexión. Revisa tus datos o el wifi.';
  return 'No pudimos continuar. Intenta de nuevo.';
}

export default function Auth() {
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
    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: correo.trim(), password: pass })
        : await supabase.auth.signUp({ email: correo.trim(), password: pass, options: { data: { full_name: nombre.trim() } } });
    setBusy(false);
    // On success the session guard in _layout swaps to the app
    if (error) setErrors({ form: authMessage(error.message) });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Header />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={type.h1}>{mode === 'login' ? 'Entra a Petzo' : 'Crea tu cuenta'}</Text>
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
          {errors.form ? <Text style={[type.small, { color: color.error }]} accessibilityRole="alert">{errors.form}</Text> : null}
          <Button label={busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'} onPress={submit} disabled={busy} style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  eye: { position: 'absolute', right: 0, top: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
