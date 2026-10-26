import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, CloudAlert, MessageCircle, RefreshCw, Search, Send } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, Pill, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, openContact, type MyRequest } from '@/lib/api';
import { REQUEST_STATUS, timeAgo } from '@/lib/format';
import { color, font, radius, shadow, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

const NOTE: Record<MyRequest['status'], string> = {
  pending: 'El publicador la está revisando.',
  approved: 'Aprobada: ya puedes escribirle por WhatsApp.',
  rejected: 'No fue aprobada esta vez.',
  withdrawn: 'La retiraste.',
};

// HU-07: the adopter follows the state of each request
export default function MyRequests() {
  const say = useToast();
  const [items, setItems] = useState<MyRequest[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    api<MyRequest[]>('/me/requests').then(setItems, () => setFailed(true));
  }, []);
  useFocusEffect(load);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header />
      <View style={styles.top}>
        <Text style={type.h1} accessibilityRole="header">
          Mis solicitudes
        </Text>
        {items?.length ? <Text style={type.small}>{items.length === 1 ? '1 solicitud enviada' : `${items.length} solicitudes enviadas`}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {failed ? (
          <StateView icon={CloudAlert} title="No pudimos cargar tus solicitudes" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
        ) : !items ? (
          [0, 1].map((i) => <Skeleton key={i} style={{ height: 104, borderRadius: radius.lg }} />)
        ) : items.length === 0 ? (
          <StateView
            icon={Send}
            title="Aún no has enviado solicitudes"
            body="Cuando quieras adoptar, toca “Quiero adoptarlo” en la publicación."
            action={<Button label="Explorar peludos" icon={Search} onPress={() => router.navigate('/')} />}
          />
        ) : (
          items.map((r) => {
            const [label, fg, bg] = REQUEST_STATUS[r.status];
            return (
              <View key={r.id} style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver a ${r.petName}, ${label}`}
                  onPress={() => router.push(`/pet/${r.petId}`)}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
                >
                  <Image source={r.petPhoto} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.head}>
                      <Text style={[type.title, styles.name]} numberOfLines={1}>
                        {r.petName}
                      </Text>
                      <Pill label={label} fg={fg} bg={bg} />
                    </View>
                    <Text style={[type.small, { color: color.body }]} numberOfLines={2}>
                      {NOTE[r.status]}
                    </Text>
                    <Text style={type.caption}>{timeAgo(r.decidedAt ?? r.createdAt)}</Text>
                  </View>
                  <ChevronRight size={20} color={color.muted} />
                </Pressable>
                {/* contact stays reachable here even after the pet is adopted or paused and its page is gone */}
                {r.status === 'approved' ? (
                  <Button
                    label="Escribir por WhatsApp"
                    icon={MessageCircle}
                    onPress={() =>
                      openContact(r.id, r.petName, 'aprobaron mi solicitud').catch((e) => say(e instanceof ApiError ? e.message : 'No pudimos abrir WhatsApp.'))
                    }
                  />
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  top: { paddingHorizontal: 20, paddingBottom: 12, gap: 2 },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 12 },
  card: { gap: 16, backgroundColor: color.canvas, borderRadius: radius.lg, padding: 16, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: font.bold },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: color.sand },
});
