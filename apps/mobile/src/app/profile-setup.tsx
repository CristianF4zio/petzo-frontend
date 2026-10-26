import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, ChevronDown, Lock, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, FieldError, Footer, Header, Input, OptionSheet } from '@/components/ui';
import { ApiError, api, upload } from '@/lib/api';
import { formatWhatsapp, initials, localWhatsapp } from '@/lib/format';
import { pickAvatar, type LocalPhoto } from '@/lib/photos';
import { useSession } from '@/lib/session';
import { color, font, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

type Errors = Partial<Record<'nombre' | 'zona' | 'wa' | 'form', string>>;

export default function ProfileSetup() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { profile, municipalities, zoneName, refreshProfile } = useSession();
  const say = useToast();
  const [nombre, setNombre] = useState(profile?.fullName ?? '');
  const [zona, setZona] = useState(profile?.municipalityId ? String(profile.municipalityId) : '');
  const [wa, setWa] = useState(localWhatsapp(profile?.whatsapp));
  const [avatar, setAvatar] = useState<LocalPhoto | null>(null);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const save = async () => {
    const e: Errors = {};
    const digits = wa.replace(/\D/g, '');
    if (!nombre.trim()) e.nombre = 'Escribe tu nombre.';
    if (!zona) e.zona = 'Elige tu municipio.';
    if (!digits) e.wa = 'Escribe tu número de WhatsApp.';
    else if (digits.length !== 11 || !/^04\d{2}/.test(digits)) e.wa = 'Revisa el número: debe verse como 0412 123 4567.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      if (avatar) await upload('/me/avatar', avatar.uri);
      await api('/me', { method: 'PUT', body: { fullName: nombre.trim(), municipalityId: Number(zona), whatsapp: digits } });
      await refreshProfile();
      say('¡Listo! Tu perfil está completo.');
      if (next === 'publish') router.replace('/publish');
      else leave();
    } catch (err) {
      const f = err instanceof ApiError ? err.fields : undefined;
      // Fields the form can't point at (e.g. municipalityId) still get the general message
      setErrors({
        nombre: f?.fullName,
        wa: f?.whatsapp && 'Revisa el número: debe verse como 0412 123 4567.',
        form: f?.fullName || f?.whatsapp ? undefined : err instanceof Error ? err.message : 'Algo falló.',
      });
    } finally {
      setBusy(false);
    }
  };

  const photoUri = avatar?.uri ?? profile?.avatarUrl;
  const pick = async () => setAvatar((await pickAvatar()) ?? avatar);
  const zoneLabel = zoneName(Number(zona));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title="Completa tu perfil" onBack={leave} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={type.small}>
            {next === 'publish' ? 'Antes de publicar necesitamos algunos datos. Te toma un minuto.' : 'Lo necesitas para publicar o pedir una adopción. Te toma un minuto.'}
          </Text>
          <View style={[styles.section, styles.photoRow]}>
            <Pressable accessibilityRole="button" accessibilityLabel={photoUri ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'} onPress={pick} style={styles.avatar}>
              {photoUri ? <Image source={photoUri} style={StyleSheet.absoluteFill} contentFit="cover" /> : profile?.fullName ? <Text style={styles.initials}>{initials(profile.fullName)}</Text> : <Camera size={24} color={color.brand} />}
            </Pressable>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={type.title}>Foto de perfil</Text>
              <Text style={type.caption}>Opcional. Ayuda a generar confianza.</Text>
              <Button label={photoUri ? 'Cambiar foto' : 'Agregar foto'} variant="secondary" icon={Camera} onPress={pick} style={styles.photoButton} />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={type.title}>Tus datos</Text>
            <Field label="Nombre" error={errors.nombre}>
              <Input value={nombre} onChangeText={setNombre} placeholder="Tu nombre y apellido" error={!!errors.nombre} autoComplete="name" style={styles.white} />
            </Field>
            <Field label="Zona" error={errors.zona}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Zona: ${zoneLabel || 'elige tu municipio'}`} onPress={() => setZoneOpen(true)} style={[styles.select, errors.zona && { borderColor: color.error }]}>
                <MapPin size={20} color={color.muted} />
                <Text style={[type.body, { flex: 1, color: zoneLabel ? color.ink : color.muted }]} numberOfLines={1}>
                  {zoneLabel || 'Elige tu municipio'}
                </Text>
                <ChevronDown size={20} color={color.ink} />
              </Pressable>
            </Field>
          </View>
          <View style={styles.section}>
            <Text style={type.title}>WhatsApp</Text>
            <View style={[styles.wa, errors.wa && { borderColor: color.error }]}>
              <Text style={styles.prefix}>+58</Text>
              <TextInput
                accessibilityLabel="Número de WhatsApp"
                value={wa}
                onChangeText={(v) => setWa(formatWhatsapp(v))}
                placeholder="0412 123 4567"
                placeholderTextColor={color.muted}
                keyboardType="number-pad"
                style={styles.waInput}
              />
            </View>
            <FieldError message={errors.wa} />
            <View style={styles.lock}>
              <Lock size={16} color={color.ink} />
              <Text style={[type.small, { color: color.body, flex: 1 }]}>Lo pedimos para conectarte con quien adopta o publica. Solo se comparte cuando se aprueba una solicitud.</Text>
            </View>
          </View>
          <FieldError message={errors.form} />
        </ScrollView>
        <Footer>
          <Button label={busy ? 'Guardando…' : 'Guardar'} onPress={save} disabled={busy} />
        </Footer>
      </KeyboardAvoidingView>
      <OptionSheet
        visible={zoneOpen}
        title="Municipio"
        options={municipalities.map((m) => ({ value: String(m.id), label: m.name }))}
        value={zona}
        onPick={(v) => {
          setZona(v);
          setErrors((e) => ({ ...e, zona: undefined }));
        }}
        onClose={() => setZoneOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24, gap: 16 },
  section: { backgroundColor: color.soft, borderRadius: radius.lg, padding: 16, gap: 16 },
  photoRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: radius.full, backgroundColor: color.peach, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { fontFamily: font.bold, fontSize: 24, color: color.brand },
  photoButton: { height: 44, alignSelf: 'flex-start', paddingHorizontal: 16 },
  white: { backgroundColor: color.canvas },
  select: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, paddingHorizontal: 16, backgroundColor: color.canvas },
  wa: { flexDirection: 'row', height: 52, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, backgroundColor: color.canvas, overflow: 'hidden' },
  prefix: { fontFamily: font.medium, fontSize: 16, color: color.body, backgroundColor: color.strong, paddingHorizontal: 14, textAlignVertical: 'center', lineHeight: 50, borderRightWidth: 1, borderRightColor: color.hairline },
  waInput: { flex: 1, paddingHorizontal: 12, fontFamily: font.regular, fontSize: 16, color: color.ink },
  lock: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
});
