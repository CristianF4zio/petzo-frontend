import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { BadgeCheck, Camera, ChevronRight, Heart, LogOut, MapPin, Phone, Send, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, FieldError, Input, Pill, Sheet } from '@/components/ui';
import { ApiError, api, type Pet } from '@/lib/api';
import { PLAN_LIMITS, REQUEST_STATUS, initials, isActive, localWhatsapp } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, shadow, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

// Grouped menu row: pastel icon circle, label, optional value, chevron
function Row({ icon: Icon, tint, label, sub, value, first, onPress }: { icon: LucideIcon; tint: string; label: string; sub?: string; value?: ReactNode; first?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && { backgroundColor: color.cream }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: tint }]}>
        <Icon size={20} color={color.ink} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={type.caption}>{sub}</Text> : null}
      </View>
      {value}
      {onPress ? <ChevronRight size={20} color={color.muted} /> : null}
    </Pressable>
  );
}

const FOUNDATION_SUB: Record<string, string> = {
  none: 'Badge de verificada y acceso al plan Pro',
  pending: 'Solicitud en revisión',
  rejected: 'No fue aprobada. Puedes enviarla de nuevo',
  verified: 'Tus publicaciones muestran el badge',
};

// [label, text, background]
const FOUNDATION_BADGE: Record<string, [string, string, string]> = {
  pending: REQUEST_STATUS.pending,
  rejected: REQUEST_STATUS.rejected,
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
  const { profile, municipalities, zoneName, favIds, refreshProfile, signOut } = useSession();
  const say = useToast();
  const [active, setActive] = useState(0);
  const [foundation, setFoundation] = useState(false);
  const verification = profile?.verificationStatus ?? 'none';
  const verified = verification === 'verified';
  const pro = profile?.plan === 'pro';
  const limit = PLAN_LIMITS[profile?.plan ?? 'free'];
  const missing = !profile || !municipalities.length; // startup load failed (offline)

  useFocusEffect(
    useCallback(() => {
      api<Pet[]>('/me/pets').then((pets) => setActive(pets.filter((p) => isActive(p.status)).length), () => {});
      if (missing) refreshProfile().catch(() => {});
    }, [missing, refreshProfile]),
  );

  const name = profile?.fullName || 'Sin nombre';
  const wa = localWhatsapp(profile?.whatsapp);
  const edit = () => router.push('/profile-setup');
  const badge = FOUNDATION_BADGE[verification];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[type.h1, styles.title]} accessibilityRole="header">
          Perfil
        </Text>

        <View style={[styles.section, styles.me]}>
          {/* photo is picked and uploaded in profile-setup */}
          <Pressable accessibilityRole="button" accessibilityLabel="Cambiar foto de perfil" onPress={edit} style={styles.avatarHit}>
            <View style={styles.avatar}>
              {profile?.avatarUrl ? <Image source={profile.avatarUrl} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={styles.initials}>{initials(name)}</Text>}
            </View>
            <View style={styles.camera}>
              <Camera size={14} color={color.canvas} />
            </View>
          </Pressable>
          <Text style={[type.h2, styles.name]} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.meta}>
            <View style={styles.inline}>
              <MapPin size={14} color={color.muted} />
              <Text style={type.small}>{zoneName(profile?.municipalityId) || 'Sin zona'}</Text>
            </View>
            <View style={styles.inline}>
              <Phone size={14} color={color.muted} />
              <Text style={type.small}>{wa ? `+58 ${wa}` : 'Sin WhatsApp'}</Text>
            </View>
          </View>
          <View style={styles.badges}>
            <Pill label={pro ? 'Pro' : 'Gratis'} fg={pro ? '#9A3412' : color.ink} bg={pro ? color.brandSoft : color.sand} />
            {verified ? (
              <View style={[styles.badge, { backgroundColor: color.mint }]}>
                <BadgeCheck size={14} color={color.verified} />
                <Text style={[type.badge, { color: color.verified }]}>Verificada</Text>
              </View>
            ) : null}
          </View>
          <Button label="Editar perfil" variant="secondary" onPress={edit} style={styles.edit} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={type.title}>Tu plan</Text>
            <Text style={[type.small, { color: color.body }]}>{`${active} de ${limit} publicaciones activas`}</Text>
          </View>
          <View style={styles.quota}>
            <View style={{ height: '100%', width: `${Math.min(100, (active / limit) * 100)}%`, backgroundColor: color.brand, borderRadius: radius.full }} />
          </View>
          {pro ? null : <Button label="Pásate a Pro: hasta 30 activas" variant="text" onPress={() => say('El plan Pro llega pronto. Te avisamos.')} style={{ height: 44 }} />}
        </View>

        <View style={styles.section}>
          <Text style={type.title}>Tu actividad</Text>
          <View style={styles.menu}>
            <Row
              first
              icon={Heart}
              tint={color.peach}
              label="Favoritos"
              sub={favIds.size === 1 ? '1 peludo guardado' : `${favIds.size} peludos guardados`}
              onPress={() => router.push('/favorites')}
            />
            <Row icon={Send} tint={color.sky} label="Mis solicitudes" sub="Estado de tus solicitudes de adopción" onPress={() => router.push('/my-requests')} />
            <Row icon={Sparkles} tint={color.lilac} label="Recomendados por IA" sub="Cuestionario de estilo de vida" onPress={() => router.push('/match')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={type.title}>Fundación</Text>
          <View style={styles.menu}>
            {verified ? (
              <Row first icon={BadgeCheck} tint={color.mint} label={profile?.foundationName || 'Fundación verificada'} sub={FOUNDATION_SUB.verified} />
            ) : (
              <Row
                first
                icon={BadgeCheck}
                tint={color.butter}
                label="Cuenta de fundación"
                sub={FOUNDATION_SUB[verification]}
                value={badge ? <Pill label={badge[0]} fg={badge[1]} bg={badge[2]} /> : undefined}
                onPress={() => (verification === 'pending' ? say('Tu solicitud está en revisión. Te avisamos al terminar.') : setFoundation(true))}
              />
            )}
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && { backgroundColor: color.cream }]}>
          <LogOut size={20} color={color.error} />
          <Text style={styles.signOutLabel}>Cerrar sesión</Text>
        </Pressable>
        <Text style={[type.caption, { textAlign: 'center' }]}>{`Petzo v${Constants.expoConfig?.version ?? '1.0.0'}`}</Text>
      </ScrollView>
      <FoundationSheet visible={foundation} onClose={() => setFoundation(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  body: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  title: { paddingTop: 8, paddingBottom: 4 },
  section: { backgroundColor: color.canvas, borderRadius: radius.lg, padding: 16, gap: 12, ...shadow },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  me: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatarHit: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: radius.full, backgroundColor: color.peach, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { fontFamily: font.bold, fontSize: 24, color: color.brandText },
  camera: { position: 'absolute', right: 2, bottom: 2, width: 28, height: 28, borderRadius: radius.full, backgroundColor: color.ink, borderWidth: 2, borderColor: color.canvas, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: font.bold, textAlign: 'center' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16, rowGap: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 10, borderRadius: radius.full },
  edit: { alignSelf: 'stretch', marginTop: 8 },
  quota: { height: 6, borderRadius: radius.full, backgroundColor: color.hairline, overflow: 'hidden' },
  menu: { marginHorizontal: -12, borderRadius: radius.md, overflow: 'hidden' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: color.hairline },
  rowIcon: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: font.semibold, fontSize: 16, lineHeight: 21, color: color.ink },
  signOut: { height: 52, borderRadius: radius.full, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.canvas, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  signOutLabel: { fontFamily: font.semibold, fontSize: 16, color: color.error },
});
