import { router } from 'expo-router';
import { Mail, PawPrint } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { color, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

export default function Welcome() {
  const say = useToast();
  const { signInWithGoogle } = useSession();
  const [busy, setBusy] = useState(false);

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

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* shortcut: neutral surface until the brand photo exists; add assets/welcome.jpg in S7 */}
      <View style={styles.hero}>
        <View style={styles.logo}>
          <PawPrint size={20} color={color.brand} />
          <Text style={type.title}>Petzo</Text>
        </View>
        <PawPrint size={96} color={color.hairline} />
      </View>
      <View style={styles.body}>
        <Text style={type.h1}>Adopta un peludo en Caracas, con confianza</Text>
        <Text style={[type.body, { marginBottom: 4 }]}>
          Revisamos cada publicación para evitar fraudes. Si el publicador aprueba tu solicitud, hablan directo por WhatsApp.
        </Text>
        <Button label={busy ? 'Abriendo Google…' : 'Continuar con Google'} onPress={google} disabled={busy} />
        <Button label="Entrar con correo" variant="secondary" icon={Mail} onPress={() => router.push('/auth')} />
        <Text style={[type.caption, { textAlign: 'center', marginTop: 4 }]}>Al continuar aceptas los Términos y la Política de privacidad.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  hero: { flex: 1, backgroundColor: color.soft, alignItems: 'center', justifyContent: 'center' },
  logo: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.canvas, borderRadius: radius.full, paddingVertical: 8, paddingLeft: 10, paddingRight: 14 },
  body: { padding: 16, paddingTop: 24, gap: 12 },
});
