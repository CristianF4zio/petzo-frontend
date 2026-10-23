import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Cat, CloudAlert, Dog, RefreshCw, SearchX, SlidersHorizontal, Sparkles, WifiOff } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiltersSheet } from '@/components/FiltersSheet';
import { PetCard } from '@/components/PetCard';
import { Button, Chip, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, type Page, type Pet, type Species } from '@/lib/api';
import { DEFAULT_FILTERS, NO_MAX, activeCount, ageLabel, toQuery, type Filters } from '@/lib/filters';
import { SEX, SIZE } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, shadow, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

type Status = 'loading' | 'ready' | 'error' | 'offline';

function SkeletonCard() {
  return (
    <View style={{ gap: 8 }}>
      <Skeleton style={{ aspectRatio: 4 / 3, borderRadius: radius.md }} />
      <Skeleton style={{ height: 16, width: '55%', marginTop: 4 }} />
      <Skeleton style={{ height: 14, width: '75%' }} />
      <Skeleton style={{ height: 14, width: '40%' }} />
    </View>
  );
}

export default function Catalog() {
  const { zoneName, favIds, toggleFav } = useSession();
  const say = useToast();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [items, setItems] = useState<Pet[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async (f: Filters) => {
    setStatus('loading');
    try {
      const r = await api<Page<Pet>>(toQuery(f, 1));
      setItems(r.items);
      setTotal(r.total);
      setPage(1);
      setStatus('ready');
    } catch (e) {
      setStatus(e instanceof ApiError && e.code === 'OFFLINE' ? 'offline' : 'error');
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  const loadMore = async () => {
    if (loadingMore || status !== 'ready' || items.length >= total) return;
    setLoadingMore(true);
    try {
      const r = await api<Page<Pet>>(toQuery(filters, page + 1));
      setItems((prev) => [...prev, ...r.items.filter((p) => !prev.some((x) => x.id === p.id))]);
      setPage(page + 1);
    } catch {
      say('No pudimos cargar más peludos.');
    } finally {
      setLoadingMore(false);
    }
  };

  const onOpen = useCallback((id: string) => router.push(`/pet/${id}`), []);
  const onFav = useCallback((id: string) => toggleFav(id).catch(() => say('No pudimos guardar el favorito.')), [toggleFav, say]);

  const setSpecies = (s: Species) => setFilters((f) => ({ ...f, species: f.species === s ? '' : s }));
  const n = activeCount(filters);
  const hasAge = filters.minAge !== 0 || filters.maxAge !== NO_MAX;
  const chips = [
    { label: filters.species ? (filters.species === 'dog' ? 'Perros' : 'Gatos') : 'Especie', on: !!filters.species },
    { label: filters.sizes.length ? filters.sizes.map((s) => SIZE[s]).join(', ') : 'Tamaño', on: filters.sizes.length > 0 },
    { label: hasAge ? `${ageLabel(filters.minAge)} – ${ageLabel(filters.maxAge)}` : 'Edad', on: hasAge },
    { label: filters.sex ? SEX[filters.sex] : 'Sexo', on: !!filters.sex },
    { label: filters.zone ? zoneName(filters.zone) : 'Zona', on: !!filters.zone },
  ];

  const retry = <Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={() => load(filters)} />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.species} accessibilityRole="radiogroup" accessibilityLabel="Especie">
          {(
            [
              ['dog', 'Perros', Dog],
              ['cat', 'Gatos', Cat],
            ] as const
          ).map(([value, label, Icon]) => {
            const on = filters.species === value;
            return (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setSpecies(value)} style={[styles.speciesBtn, on && { backgroundColor: color.strong }]}>
                <Icon size={20} color={color.ink} />
                <Text style={[styles.speciesLabel, on && { fontFamily: font.semibold }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
        <Chip label="Para ti" icon={Sparkles} onPress={() => router.push('/match')} />
        <Chip label="Filtros" icon={SlidersHorizontal} on={n > 0} count={n} onPress={() => setSheet(true)} />
        {chips.map((c) => (
          <Chip key={c.label} label={c.label} on={c.on} onPress={() => setSheet(true)} />
        ))}
      </ScrollView>

      {status === 'loading' ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : status === 'error' ? (
        <StateView icon={CloudAlert} title="No pudimos cargar los peludos" body="Algo falló de nuestro lado. Tus filtros siguen guardados." action={retry} />
      ) : status === 'offline' ? (
        <StateView icon={WifiOff} title="Sin conexión" body="Revisa tus datos o el wifi. Cuando vuelva la señal te mostramos los peludos." action={retry} />
      ) : items.length === 0 ? (
        <StateView
          icon={SearchX}
          title="No hay peludos con esos filtros"
          body="Prueba con otra zona o amplía el rango de edad."
          action={<Button label="Limpiar filtros" variant="secondary" onPress={() => setFilters(DEFAULT_FILTERS)} />}
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={<Text style={[type.small, { marginBottom: 24 }]}>{`${total} peludos en ${filters.zone ? zoneName(filters.zone) : 'Gran Caracas'}`}</Text>}
          renderItem={({ item }) => <PetCard pet={item} zone={zoneName(item.municipalityId)} fav={favIds.has(item.id)} onOpen={onOpen} onFav={onFav} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ marginTop: 24 }}>
                <SkeletonCard />
              </View>
            ) : items.length >= total ? (
              <Text style={[type.caption, styles.end]}>Eso es todo por ahora. Publican peludos nuevos todos los días.</Text>
            ) : null
          }
          onRefresh={() => load(filters)}
          refreshing={false}
        />
      )}

      <FiltersSheet
        visible={sheet}
        filters={filters}
        onClose={() => setSheet(false)}
        onApply={(f) => {
          setFilters(f);
          setSheet(false);
        }}
      />
    </SafeAreaView>
  );
}

const Separator = () => <View style={{ height: 24 }} />;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  top: { paddingHorizontal: 16, paddingTop: 12 },
  species: { flexDirection: 'row', height: 56, borderRadius: radius.full, backgroundColor: color.canvas, padding: 4, ...shadow },
  speciesBtn: { flex: 1, height: 48, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  speciesLabel: { fontFamily: font.medium, fontSize: 16, color: color.ink },
  chipBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: color.hairline },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  list: { padding: 16, gap: 24 },
  listContent: { padding: 16 },
  end: { textAlign: 'center', paddingTop: 24, paddingBottom: 16 },
});
