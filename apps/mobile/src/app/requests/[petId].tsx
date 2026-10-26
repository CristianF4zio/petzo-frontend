import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, CloudAlert, Inbox, MessageCircle, RefreshCw, Sparkles } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, Pill, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, openContact, type AdoptionRequest, type Pet } from '@/lib/api';
import { HOUSING, REQUEST_STATUS, initials, scoreColors, timeAgo } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, shadow, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

// HU-08 + HU-09: requests for one of my pets, newest first; approving one leaves the rest pending
export default function PetRequests() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { zoneName } = useSession();
  const say = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [items, setItems] = useState<AdoptionRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setFailed(false);
    api<Pet>(`/pets/${petId}`).then(setPet, () => {});
    api<AdoptionRequest[]>(`/pets/${petId}/requests`).then(setItems, () => setFailed(true));
  }, [petId]);
  useFocusEffect(load);

  const decide = async (r: AdoptionRequest, approve: boolean) => {
    setBusy(r.id);
    try {
      const updated = await api<AdoptionRequest>(`/requests/${r.id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' });
      setItems((list) => list?.map((x) => (x.id === r.id ? updated : x)) ?? null);
      say(approve ? `Aprobada. Ya puedes escribirle a ${r.adopter.name ?? 'quien la envió'} por WhatsApp.` : 'Solicitud rechazada.');
    } catch (e) {
      say(e instanceof ApiError ? e.message : 'No pudimos guardar tu respuesta.');
    } finally {
      setBusy(null);
    }
  };

  const openWhatsapp = (r: AdoptionRequest) =>
    openContact(r.id, pet?.name ?? 'mi peludo', 'aprobé tu solicitud').catch((e) =>
      say(e instanceof ApiError ? e.message : 'No pudimos abrir WhatsApp.'),
    );
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const adopted = pet?.status === 'adopted';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title={pet?.name ?? 'Solicitudes'} />
      <ScrollView contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        {failed ? (
          <StateView icon={CloudAlert} title="No pudimos cargar las solicitudes" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
        ) : !items ? (
          [0, 1].map((i) => <Skeleton key={i} style={{ height: 200, borderRadius: radius.lg }} />)
        ) : items.length === 0 ? (
          <StateView icon={Inbox} title="Aún no hay solicitudes" body="Cuando alguien quiera adoptar, aquí verás su solicitud con un resumen y un puntaje." />
        ) : (
          <>
            <View style={{ gap: 2 }}>
              <Text style={type.h1} accessibilityRole="header">
                Solicitudes
              </Text>
              <Text style={type.small}>{`${items.length} ${items.length === 1 ? 'persona quiere' : 'personas quieren'} adoptar${pet ? ` a ${pet.name}` : ''}`}</Text>
            </View>
            {items.map((r) => {
              const [label, fg, bg] = REQUEST_STATUS[r.status];
              const name = r.adopter.name || 'Sin nombre';
              const housing = HOUSING.find((h) => h.value === r.answers?.housing)?.label;
              const otherPets = r.answers?.otherPets;
              const expanded = open.has(r.id);
              return (
                <View key={r.id} style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.avatar}>
                      {r.adopter.avatarUrl ? <Image source={r.adopter.avatarUrl} style={StyleSheet.absoluteFill} /> : <Text style={[type.title, { color: color.brandText }]}>{initials(name)}</Text>}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={type.title} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={type.caption} numberOfLines={1}>{`${zoneName(r.adopter.municipalityId) || 'Sin zona'} · ${timeAgo(r.createdAt)}`}</Text>
                    </View>
                    <Pill label={label} fg={fg} bg={bg} />
                  </View>
                  {r.aiScore != null ? (
                    <View style={styles.ai}>
                      <View style={styles.row}>
                        <Sparkles size={20} color={color.brand} />
                        <Text style={[type.label, { fontFamily: font.semibold, flex: 1 }]}>Resumen IA</Text>
                        <Pill label={`${r.aiScore}/100`} fg={scoreColors(r.aiScore)[0]} bg={scoreColors(r.aiScore)[1]} />
                      </View>
                      {r.aiSummary ? <Text style={[type.small, { color: color.body }]}>{r.aiSummary}</Text> : null}
                    </View>
                  ) : (
                    // pre-evaluation runs after the request is saved; it may still be on its way or the AI may be off (HU-08)
                    <Text style={type.caption}>{r.status === 'pending' ? 'El resumen de IA puede tardar unos segundos. Desliza hacia abajo para actualizar.' : 'Sin resumen de IA.'}</Text>
                  )}
                  <Text style={[type.body, { color: color.ink }]}>{r.motivation}</Text>
                  {housing || typeof otherPets === 'boolean' ? (
                    <View>
                      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => toggle(r.id)} style={styles.toggle}>
                        <Text style={[type.label, { flex: 1 }]}>Respuestas</Text>
                        {expanded ? <ChevronUp size={20} color={color.ink} /> : <ChevronDown size={20} color={color.ink} />}
                      </Pressable>
                      {expanded ? (
                        <View style={styles.answers}>
                          {housing ? <Answer label="Vivienda" value={housing} /> : null}
                          {typeof otherPets === 'boolean' ? <Answer label="Otras mascotas" value={otherPets ? 'Sí' : 'No'} /> : null}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  {r.status === 'pending' ? (
                    <View style={styles.buttons}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: busy === r.id }}
                        disabled={busy === r.id}
                        onPress={() => decide(r, false)}
                        style={({ pressed }) => [styles.reject, pressed && { backgroundColor: color.cream }]}
                      >
                        <Text style={[styles.rejectLabel, busy === r.id && { color: color.muted }]}>Rechazar</Text>
                      </Pressable>
                      {adopted ? null : <Button label="Aprobar" disabled={busy === r.id} onPress={() => decide(r, true)} style={{ flex: 1 }} />}
                    </View>
                  ) : r.status === 'approved' ? (
                    <Button label="Escribir por WhatsApp" icon={MessageCircle} onPress={() => openWhatsapp(r)} />
                  ) : null}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Answer({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.answer}>
      <Text style={type.small}>{label}</Text>
      <Text style={type.label}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 16 },
  card: { borderRadius: radius.lg, padding: 16, gap: 12, backgroundColor: color.canvas, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: color.peach, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ai: { backgroundColor: color.cream, borderRadius: radius.md, padding: 12, gap: 8 },
  toggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: color.hairline },
  answers: { backgroundColor: color.cream, borderRadius: radius.md, paddingHorizontal: 12 },
  answer: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttons: { flexDirection: 'row', gap: 12 },
  reject: { flex: 1, height: 52, borderRadius: radius.full, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center' },
  rejectLabel: { fontFamily: font.semibold, fontSize: 16, color: color.error },
});
