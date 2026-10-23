import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { CloudAlert, Info, PawPrint, RefreshCw } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Pill, Sheet, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, type Pet, type PetStatus } from '@/lib/api';
import { PLAN_LIMITS, STATUS, isActive, timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

const UPDATED: Record<PetStatus, string> = {
  draft: 'Borrador guardado',
  pending_review: 'Enviada',
  approved: 'Publicada',
  rejected: 'Revisada',
  paused: 'Pausada',
  adopted: 'Adoptada',
};

export default function Mine() {
  const { profile } = useSession();
  const say = useToast();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
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
    const adopt = { label: 'Marcar como adoptada', run: () => setStatus(p, 'adopted', `¡Qué alegría! ${p.name} encontró hogar.`) };
    const confirmEdit = { label: 'Editar', run: () => setEditing(p) };
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
        return { primary: { label: 'Continuar borrador', run: () => edit(p) }, actions: [{ label: 'Eliminar', run: () => remove(p) }] };
      case 'adopted':
        return { note: 'Gracias por ayudar a que encontrara familia.', primary: requests };
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.head}>
        <Text style={type.h1}>Mis publicaciones</Text>
        <Pill label={`${active} de ${limit} activas`} fg={color.body} bg={color.strong} />
      </View>
      <ScrollView contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        {failed ? (
          <StateView icon={CloudAlert} title="No pudimos cargar tus publicaciones" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
        ) : !pets ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={[styles.card, { flexDirection: 'row', gap: 12 }]}>
              <Skeleton style={{ width: 64, height: 64, borderRadius: radius.md }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={{ height: 16, width: '60%' }} />
                <Skeleton style={{ height: 20, width: 80, borderRadius: radius.full }} />
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
            <View style={styles.info}>
              <Info size={18} color={color.ink} />
              <Text style={[type.small, { color: color.body, flex: 1 }]}>Si editas una publicación activa, vuelve a revisión antes de mostrarse otra vez.</Text>
            </View>
            {pets.map((p) => {
              const [label, fg, bg] = STATUS[p.status];
              const { actions, primary, note } = actionsFor(p);
              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.row}>
                    <Image source={p.photos[0]?.url} style={styles.thumb} contentFit="cover" />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={type.title} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Pill label={label} fg={fg} bg={bg} />
                      <Text style={type.caption}>{`${UPDATED[p.status]} ${timeAgo(p.updatedAt)}`}</Text>
                    </View>
                  </View>
                  {p.status === 'rejected' && p.moderationReason ? (
                    <View style={styles.reason}>
                      <Text style={[type.label, { color: color.error, fontFamily: font.semibold }]}>Motivo del rechazo</Text>
                      <Text style={[type.small, { color: color.error }]}>{p.moderationReason}</Text>
                    </View>
                  ) : null}
                  {note ? <Text style={type.caption}>{note}</Text> : null}
                  {primary ? <Button label={primary.label} variant="secondary" onPress={primary.run} /> : null}
                  {actions?.length ? (
                    <View style={styles.actions}>
                      {actions.map((a) => (
                        <Pressable key={a.label} accessibilityRole="button" onPress={a.run} style={styles.action}>
                          <Text style={[type.label, { textDecorationLine: 'underline' }]}>{a.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <Sheet visible={!!editing} onClose={() => setEditing(null)}>
        <Text style={type.h2}>{`¿Editar a ${editing?.name}?`}</Text>
        <Text style={type.body}>Al guardar los cambios, la publicación vuelve a revisión y no se mostrará en el catálogo hasta que la aprobemos. Suele tardar unos minutos.</Text>
        <View style={{ gap: 12 }}>
          <Button
            label="Editar y enviar a revisión"
            onPress={() => {
              const p = editing!;
              setEditing(null);
              edit(p);
            }}
          />
          <Button label="Cancelar" variant="secondary" onPress={() => setEditing(null)} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  info: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: color.soft, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16 },
  card: { borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: color.strong },
  reason: { backgroundColor: color.errorBg, borderRadius: radius.sm, padding: 12, gap: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, borderTopWidth: 1, borderTopColor: color.hairline, marginHorizontal: -16, marginBottom: -8, paddingHorizontal: 16 },
  action: { height: 48, justifyContent: 'center' },
});
