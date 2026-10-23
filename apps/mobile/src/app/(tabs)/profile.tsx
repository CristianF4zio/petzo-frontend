import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { BadgeCheck, ChevronRight, Heart, MapPin, Pencil, Phone, Send, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, FieldError, Input, Pill, Sheet, VerifiedBadge } from '@/components/ui';
import { ApiError, api, type Pet } from '@/lib/api';
import { PLAN_LIMITS, initials, isActive, localWhatsapp } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';


function Row({ icon: Icon, label, sub, onPress }: { icon: LucideIcon; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Icon size={24} color={color.ink} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, { color: color.ink }]}>{label}</Text>
        <Text style={type.caption}>{sub}</Text>
      </View>
      <ChevronRight size={20} color={color.muted} />
    </Pressable>
  );
}

const FOUNDATION_SUB: Record<string, string> = {
  none: 'Badge de verificada y acceso al plan Pro',
  pending: 'Solicitud en revisión',
  rejected: 'No fue aprobada. Puedes enviarla de nuevo',
};

// HU-12 / RF-05: name, Instagram and description; the admin verifies it in the panel
function FoundationSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile, refreshProfile } = useSession();
  const say = useToast();
  const [name, setName] = useState(profile?.foundationName ?? '');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState<{ name?: string; instagram?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = 'Escribe el nombre de la fundación.';
    if (!/^@?[A-Za-z0-9._]{1,30}$/.test(instagram.trim())) e.instagram = 'Escribe el usuario de Instagram, por ejemplo @patasdelavila.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api('/me/foundation-request', { method: 'POST', body: { foundationName: name.trim(), foundationInstagram: instagram.trim(), foundationBio: bio.trim() || null } });
      await refreshProfile();
      say('Enviamos tu solicitud. Te avisamos cuando la revisemos.');
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'No pudimos enviar la solicitud.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title="Cuenta de fundación" onClose={onClose} footer={<Button label={busy ? 'Enviando…' : 'Solicitar verificación'} disabled={busy} onPress={send} />}>
      <Text style={type.body}>Las fundaciones verificadas muestran un badge en sus publicaciones y pueden pasar al plan Pro (hasta 30 activas).</Text>
      <Field label="Nombre de la fundación" error={errors.name}>
        <Input value={name} onChangeText={setName} maxLength={80} error={!!errors.name} />
      </Field>
      <Field label="Instagram" error={errors.instagram}>
        <Input value={instagram} onChangeText={setInstagram} autoCapitalize="none" placeholder="@usuario" error={!!errors.instagram} />
      </Field>
      <Field label="Descripción (opcional)">
        <Input value={bio} onChangeText={setBio} maxLength={500} multiline style={{ minHeight: 96, textAlignVertical: 'top' }} />
      </Field>
      <FieldError message={errors.form} />
    </Sheet>
  );
}

export default function Profile() {
  const { profile, zoneName, favIds, signOut } = useSession();
  const say = useToast();
  const [active, setActive] = useState(0);
  const [foundation, setFoundation] = useState(false);
  const verification = profile?.verificationStatus ?? 'none';
  const limit = PLAN_LIMITS[profile?.plan ?? 'free'];

  useFocusEffect(
    useCallback(() => {
      api<Pet[]>('/me/pets').then((pets) => setActive(pets.filter((p) => isActive(p.status)).length), () => {});
    }, []),
  );

  const name = profile?.fullName || 'Sin nombre';
  const wa = localWhatsapp(profile?.whatsapp);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={type.h1}>Perfil</Text>
        <View style={styles.me}>
          <View style={styles.avatar}>
            {profile?.avatarUrl ? <Image source={profile.avatarUrl} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={type.h2}>{initials(name)}</Text>}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={type.h2}>{name}</Text>
            <View style={styles.inline}>
              <MapPin size={14} color={color.muted} />
              <Text style={type.small}>{zoneName(profile?.municipalityId) || 'Sin zona'}</Text>
            </View>
            {verification === 'verified' ? <VerifiedBadge /> : null}
          </View>
        </View>
        <View style={styles.plan}>
          <View style={styles.planHead}>
            <Text style={type.title}>Tu plan</Text>
            <Pill label={profile?.plan === 'pro' ? 'Pro' : 'Gratis'} fg={color.body} bg={color.strong} />
          </View>
          <Text style={[type.small, { color: color.body }]}>{`${active} de ${limit} publicaciones activas`}</Text>
          <View style={styles.quota}>
            <View style={{ height: '100%', width: `${Math.min(100, (active / limit) * 100)}%`, backgroundColor: color.ink }} />
          </View>
          {profile?.plan === 'pro' ? null : <Button label="Pásate a Pro: hasta 30 activas" variant="text" onPress={() => say('El plan Pro llega pronto. Te avisamos.')} style={{ height: 40 }} />}
        </View>
        <View>
          <Row icon={Phone} label="WhatsApp" sub={`${wa ? `+58 ${wa}` : 'Sin número'} · solo visible al aprobar`} onPress={() => router.push('/profile-setup')} />
          <Row icon={Send} label="Mis solicitudes" sub="Estado de tus solicitudes de adopción" onPress={() => router.push('/my-requests')} />
          <Row icon={Sparkles} label="Recomendados para ti" sub="Cuestionario de estilo de vida" onPress={() => router.push('/match')} />
          <Row icon={Heart} label="Favoritos" sub={favIds.size === 1 ? '1 peludo guardado' : `${favIds.size} peludos guardados`} onPress={() => router.push('/favorites')} />
          {verification === 'verified' ? null : (
            <Row
              icon={BadgeCheck}
              label="Cuenta de fundación"
              sub={FOUNDATION_SUB[verification]!}
              onPress={() => (verification === 'pending' ? say('Tu solicitud está en revisión. Te avisamos al terminar.') : setFoundation(true))}
            />
          )}
          <Row icon={Pencil} label="Editar perfil" sub="Nombre, foto y zona" onPress={() => router.push('/profile-setup')} />
        </View>
        <Button label="Cerrar sesión" variant="text" onPress={signOut} />
      </ScrollView>
      <FoundationSheet visible={foundation} onClose={() => setFoundation(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  body: { padding: 16, paddingBottom: 24, gap: 20 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 72, height: 72, borderRadius: radius.full, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.strong, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  plan: { borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, padding: 16, gap: 12 },
  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quota: { height: 4, borderRadius: radius.full, backgroundColor: color.strong, overflow: 'hidden' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.hairline },
});
