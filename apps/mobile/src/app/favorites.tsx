import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { CloudAlert, Heart, RefreshCw, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PetCard } from '@/components/PetCard';
import { Button, Header, Skeleton, StateView } from '@/components/ui';
import { api, type Pet } from '@/lib/api';
import { useSession } from '@/lib/session';
import { color, radius } from '@/lib/theme';
import { useToast } from '@/lib/toast';

function SkeletonCard() {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Skeleton style={{ aspectRatio: 1, borderRadius: radius.md }} />
      <Skeleton style={{ height: 16, width: '60%', marginTop: 2 }} />
      <Skeleton style={{ height: 12, width: '80%' }} />
    </View>
  );
}

export default function Favorites() {
  const { zoneName, favIds, toggleFav } = useSession();
  const say = useToast();
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    api<Pet[]>('/me/favorites').then(setPets, () => setFailed(true));
  }, []);
  useFocusEffect(load);

  const onOpen = useCallback((id: string) => router.push(`/pet/${id}`), []);
  // Unsaved pets stay listed until the next visit, so a second tap undoes it
  const onFav = useCallback((id: string) => toggleFav(id).catch(() => say('No pudimos guardar el favorito.')), [toggleFav, say]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title="Favoritos" />
      {pets?.length && !failed ? (
        <FlashList
          data={pets}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.body}
          renderItem={({ item, index }) => (
            <View style={index % 2 ? styles.right : styles.left}>
              <PetCard pet={item} zone={zoneName(item.municipalityId)} fav={favIds.has(item.id)} onOpen={onOpen} onFav={onFav} />
            </View>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {failed ? (
            <StateView icon={CloudAlert} title="No pudimos cargar tus favoritos" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
          ) : !pets ? (
            <View style={styles.skeletonRow}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <StateView
              icon={Heart}
              title="Aún no tienes favoritos"
              body="Toca el corazón en cualquier peludo para guardarlo aquí."
              action={<Button label="Explorar peludos" icon={Search} onPress={() => router.navigate('/')} />}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  skeletonRow: { flexDirection: 'row', gap: 16 },
  left: { paddingRight: 8, paddingBottom: 20 },
  right: { paddingLeft: 8, paddingBottom: 20 },
});
