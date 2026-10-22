import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { CloudAlert, Heart, RefreshCw } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { petMeta } from '@/components/PetCard';
import { Button, Header, Skeleton, StateView } from '@/components/ui';
import { api, type Pet } from '@/lib/api';
import { useSession } from '@/lib/session';
import { color, radius, type } from '@/lib/theme';

export default function Favorites() {
  const { zoneName } = useSession();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    api<Pet[]>('/me/favorites').then(setPets, () => setFailed(true));
  }, []);
  useFocusEffect(load);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title="Favoritos" />
      <ScrollView contentContainerStyle={styles.body}>
        {failed ? (
          <StateView icon={CloudAlert} title="No pudimos cargar tus favoritos" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
        ) : !pets ? (
          <Skeleton style={{ height: 96, borderRadius: radius.md }} />
        ) : pets.length === 0 ? (
          <StateView
            icon={Heart}
            title="Aún no tienes favoritos"
            body="Toca el corazón en cualquier peludo para guardarlo aquí."
            action={<Button label="Explorar peludos" variant="secondary" onPress={() => router.navigate('/')} />}
          />
        ) : (
          pets.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Ver a ${p.name}`} onPress={() => router.push(`/pet/${p.id}`)} style={styles.card}>
              <Image source={p.photos[0]?.url} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={type.title} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={type.small}>{petMeta(p)}</Text>
                <Text style={type.small}>{zoneName(p.municipalityId)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: color.strong },
});
