import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { CircleAlert, CloudAlert, Info, PawPrint, RefreshCw } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Pill, Sheet, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, type Pet, type PetStatus } from '@/lib/api';
import { PLAN_LIMITS, STATUS, isActive, timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, shadow, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

const UPDATED: Record<PetStatus, string> = {
  draft: 'Borrador guardado',
  pending_review: 'Enviada',
  approved: 'Publicada',
  rejected: 'Revisada',
  paused: 'Pausada',
  adopted: 'Adoptada',
};

const REJECTED = STATUS.rejected[1]; // dark red: color.error is under 4.5:1 on errorBg

const PLURAL: Record<PetStatus, string> = {
  draft: 'Borradores',
  pending_review: 'En revisión',
  approved: 'Publicadas',
  rejected: 'Rechazadas',
  paused: 'Pausadas',
  adopted: 'Adoptadas',
};
const ORDER = Object.keys(PLURAL) as PetStatus[];

export default function Mine() {
  const { profile } = useSession();
  const say = useToast();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<PetStatus | ''>('');
  const [confirm, setConfirm] = useState<{ title: string; body: string; confirmLabel: string; run: () => void } | null>(null);
  const limit = PLAN_LIMITS[profile?.plan ?? 'free'];
  const active = (pets ?? []).filter((p) => isActive(p.status)).length;

  const load = useCallback(() => {
    setFailed(false);
    api<Pet[]>('/me/pets').then(setPets, () => setFailed(true));
  }, []);
  useFocusEffect(load);

  const setStatus = async (pet: Pet, status: PetStatus, message: string) => {
    try {
      await api(`/pets/${pet.id}/status`, { method: 'PATCH', body: { status } });
      say(message);
      load();
    } catch (e) {
      say(e instanceof ApiError && e.code === 'PLAN_LIMIT' ? `Llegaste al límite de ${limit} activas. Pausa otra primero.` : 'No pudimos actualizarla. Intenta de nuevo.');
    }
  };

  const remove = async (pet: Pet) => {
    try {
      await api(`/pets/${pet.id}`, { method: 'DELETE' });
      say('Borrador eliminado.');
      load();
    } catch {
      say('No pudimos eliminar el borrador.');
    }
  };

  const edit = (pet: Pet) => router.push({ pathname: '/publish', params: { editId: pet.id } });

  function actionsFor(p: Pet) {
    const requests = { label: 'Ver solicitudes', run: () => router.push(`/requests/${p.id}`) };
    const adopt = {
      label: 'Marcar como adoptada',
      run: () =>
        setConfirm({
          title: `¿Marcar a ${p.name} como adoptada?`,
          body: 'Sale del catálogo y libera un cupo de tu plan. No se puede deshacer.',
          confirmLabel: 'Marcar como adoptada',
          run: () => setStatus(p, 'adopted', `¡Qué alegría! ${p.name} encontró hogar.`),
        }),
    };
    const confirmEdit = {
      label: 'Editar',
      run: () =>
        setConfirm({
          title: `¿Editar a ${p.name}?`,
          body: 'Al guardar los cambios, la publicación vuelve a revisión y no se mostrará en el catálogo hasta que la aprobemos. Suele tardar unos minutos.',
          confirmLabel: 'Editar y enviar a revisión',
          run: () => edit(p),
        }),
    };
    const removeDraft = {
      label: 'Eliminar',
      run: () => setConfirm({ title: `¿Eliminar el borrador de ${p.name}?`, body: 'Se borran sus datos y fotos.', confirmLabel: 'Eliminar', run: () => remove(p) }),
    };
    switch (p.status) {
      case 'approved':
        return { primary: requests, actions: [confirmEdit, { label: 'Pausar', run: () => setStatus(p, 'paused', 'Pausamos la publicación. No se muestra en el catálogo.') }, adopt] };
      case 'paused':
        return { primary: requests, actions: [{ label: 'Reanudar', run: () => setStatus(p, 'approved', 'Publicación reanudada.') }, confirmEdit, adopt] };
      case 'pending_review':
        return { note: 'La revisión suele tardar unos minutos. Te avisamos al terminar.', actions: [requests] };
      case 'rejected':
        return { primary: { label: 'Editar y reenviar', run: () => edit(p) }, actions: [requests] };
      case 'draft':
        return { primary: { label: 'Continuar borrador', run: () => edit(p) }, actions: [removeDraft] };
      case 'adopted':
        return { note: 'Gracias por ayudar a que encontrara familia.', primary: requests };
    }
  }

  const present = ORDER.filter((s) => pets?.some((p) => p.status === s));
  // a filter whose last pet just changed status falls back to "Todas"
  const on = tab && present.includes(tab) ? tab : '';
  const shown = pets?.filter((p) => !on || p.status === on) ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.head}>
        <Text style={type.h1} accessibilityRole="header">
          Mis publicaciones
        </Text>
        <Text style={type.small}>{pets ? `${pets.length} ${pets.length === 1 ? 'publicación' : 'publicaciones'} · ${active} de ${limit} activas` : `Plan con ${limit} activas`}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        {failed ? (
          <StateView icon={CloudAlert} title="No pudimos cargar tus publicaciones" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
        ) : !pets ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={[styles.card, styles.row]}>
              <Skeleton style={{ width: 72, height: 72, borderRadius: 12 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={{ height: 16, width: '60%' }} />
                <Skeleton style={{ height: 24, width: 88, borderRadius: radius.full }} />
              </View>
            </View>
          ))
        ) : pets.length === 0 ? (
          <StateView
            icon={PawPrint}
            title="Aún no has publicado"
            body="Cuando publiques, aquí verás el estado de cada peludo."
            action={<Button label="Publica a tu peludo" onPress={() => router.push('/publish')} />}
          />
        ) : (
          <>
            {present.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar} contentContainerStyle={styles.chips}>
                <Chip label="Todas" on={!on} onPress={() => setTab('')} />
                {present.map((s) => (
                  <Chip key={s} label={PLURAL[s]} on={on === s} onPress={() => setTab(s)} />
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.info}>
              <Info size={20} color={color.trust} />
              <Text style={[type.small, { color: color.body, flex: 1 }]}>Si editas una publicación activa, vuelve a revisión antes de mostrarse otra vez.</Text>
            </View>
            {shown.map((p) => {
              const { actions, primary, note } = actionsFor(p);
              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.row}>
                    <Image source={p.photos[0]?.url} style={styles.thumb} contentFit="cover" />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={type.title} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Pill label={STATUS[p.status][0]} fg={STATUS[p.status][1]} bg={STATUS[p.status][2]} />
                      <Text style={type.caption}>{`${UPDATED[p.status]} ${timeAgo(p.updatedAt)}`}</Text>
                    </View>
                  </View>
                  {p.status === 'rejected' && p.moderationReason ? (
                    <View style={styles.reason}>
                      <CircleAlert size={20} color={REJECTED} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[type.label, { color: REJECTED, fontFamily: font.semibold }]}>Motivo del rechazo</Text>
                        <Text style={[type.small, { color: REJECTED }]}>{p.moderationReason}</Text>
                      </View>
                    </View>
                  ) : null}
                  {note ? <Text style={type.small}>{note}</Text> : null}
                  <View style={styles.actions}>
                    {primary ? <Action label={primary.label} onPress={primary.run} primary /> : null}
                    {actions?.map((a) => (
                      <Action key={a.label} label={a.label} onPress={a.run} danger={a.label === 'Eliminar'} />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <Sheet visible={!!confirm} onClose={() => setConfirm(null)}>
        <Text style={type.h2}>{confirm?.title}</Text>
        <Text style={type.body}>{confirm?.body}</Text>
        <View style={{ gap: 12 }}>
          <Button
            label={confirm?.confirmLabel ?? ''}
            onPress={() => {
              confirm!.run();
              setConfirm(null);
            }}
          />
          <Button label="Cancelar" variant="secondary" onPress={() => setConfirm(null)} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

// Compact pill: ink for the card's main action, white with hairline for the rest
function Action({ label, onPress, primary, danger }: { label: string; onPress: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, primary ? { backgroundColor: pressed ? color.inkPressed : color.ink, borderColor: color.ink } : pressed && { backgroundColor: color.cream }]}
    >
      <Text style={[type.label, { fontFamily: font.semibold }, primary && { color: color.canvas }, danger && { color: color.error }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  head: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 2 },
  body: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  chipBar: { flexGrow: 0, marginHorizontal: -20, marginVertical: -8 },
  chips: { gap: 8, paddingHorizontal: 20 },
  info: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: color.sky, borderRadius: radius.md, padding: 16 },
  card: { borderRadius: radius.lg, padding: 16, gap: 12, backgroundColor: color.canvas, ...shadow },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: color.sand },
  reason: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: color.errorBg, borderRadius: radius.md, padding: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { height: 44, paddingHorizontal: 16, borderRadius: radius.full, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center' },
});
