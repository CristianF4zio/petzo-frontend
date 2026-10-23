import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { CloudAlert, MessageCircle, RefreshCw, Send } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header, Pill, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, openContact, type MyRequest } from '@/lib/api';
import { REQUEST_STATUS, timeAgo } from '@/lib/format';
import { color, radius, type } from '@/lib/theme';
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
      <Header title="Mis solicitudes" />
      <ScrollView contentContainerStyle={styles.body}>
        {failed ? (
          <StateView icon={CloudAlert} title="No pudimos cargar tus solicitudes" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
        ) : !items ? (
          <Skeleton style={{ height: 96, borderRadius: radius.md }} />
        ) : items.length === 0 ? (
          <StateView
            icon={Send}
            title="Aún no has enviado solicitudes"
            body="Cuando quieras adoptar, toca “Quiero adoptarlo” en la publicación."
            action={<Button label="Explorar peludos" variant="secondary" onPress={() => router.navigate('/')} />}
          />
        ) : (
          items.map((r) => {
            const [label, fg, bg] = REQUEST_STATUS[r.status];
            return (
              <View key={r.id} style={styles.card}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Ver a ${r.petName}`} onPress={() => router.push(`/pet/${r.petId}`)} style={styles.row}>
                  <Image source={r.petPhoto} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={type.title} numberOfLines={1}>
                      {r.petName}
                    </Text>
                    <Pill label={label} fg={fg} bg={bg} />
                    <Text style={type.caption}>{`${NOTE[r.status]} · ${timeAgo(r.decidedAt ?? r.createdAt)}`}</Text>
                  </View>
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
  root: { flex: 1, backgroundColor: color.canvas },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 },
  card: { gap: 12, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: color.strong },
});
