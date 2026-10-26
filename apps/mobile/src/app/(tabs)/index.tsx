import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Cat, CloudAlert, Dog, PawPrint, RefreshCw, Search, SearchX, SlidersHorizontal, Sparkles, WifiOff, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiltersSheet } from '@/components/FiltersSheet';
import { PetCard } from '@/components/PetCard';
import { Button, Chip, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, type Page, type Pet, type Species } from '@/lib/api';
import { DEFAULT_FILTERS, NO_MAX, activeCount, ageLabel, toQuery, type Filters } from '@/lib/filters';
import { SEX, SIZE, initials } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, shadow, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

type Status = 'loading' | 'ready' | 'error' | 'offline';

const CATEGORIES: [Species | '', string, LucideIcon, string][] = [
  ['', 'Todos', PawPrint, color.sand],
  ['dog', 'Perros', Dog, color.peach],
  ['cat', 'Gatos', Cat, color.sky],
];

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton style={{ aspectRatio: 1, borderRadius: radius.md }} />
      <View style={{ gap: 8, padding: 12 }}>
        <Skeleton style={{ height: 16, width: '60%' }} />
        <Skeleton style={{ height: 12, width: '80%' }} />
      </View>
    </View>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

export default function Catalog() {
  const { zoneName, favIds, toggleFav, profile } = useSession();
  const say = useToast();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [items, setItems] = useState<Pet[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [sheet, setSheet] = useState(false);

  // Bumped on every load; a response with an older number belongs to filters that changed meanwhile
  const req = useRef(0);

  const load = useCallback(async (f: Filters) => {
    const seq = ++req.current;
    setStatus('loading');
    try {
      const r = await api<Page<Pet>>(toQuery(f, 1));
      if (seq !== req.current) return;
      setItems(r.items);
      setTotal(r.total);
      setPage(1);
      setStatus('ready');
    } catch (e) {
      if (seq === req.current) setStatus(e instanceof ApiError && e.code === 'OFFLINE' ? 'offline' : 'error');
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  const loadMore = async () => {
    if (loadingMore || status !== 'ready' || items.length >= total) return;
    const seq = req.current;
    setLoadingMore(true);
    try {
      const r = await api<Page<Pet>>(toQuery(filters, page + 1));
      if (seq !== req.current) return;
      setItems((prev) => [...prev, ...r.items.filter((p) => !prev.some((x) => x.id === p.id))]);
      setTotal(r.total);
      setPage(page + 1);
    } catch {
      if (seq === req.current) say('No pudimos cargar más peludos.');
    } finally {
      setLoadingMore(false);
    }
  };

  const onOpen = useCallback((id: string) => router.push(`/pet/${id}`), []);
  const onFav = useCallback((id: string) => toggleFav(id).catch(() => say('No pudimos guardar el favorito.')), [toggleFav, say]);

  const setSpecies = (s: Species | '') => setFilters((f) => ({ ...f, species: s }));
  const n = activeCount(filters);
  const hasAge = filters.minAge !== 0 || filters.maxAge !== NO_MAX;
  const chips = [
    { label: filters.species ? (filters.species === 'dog' ? 'Perros' : 'Gatos') : 'Especie', on: !!filters.species },
    { label: filters.sizes.length ? filters.sizes.map((s) => SIZE[s]).join(', ') : 'Tamaño', on: filters.sizes.length > 0 },
    { label: hasAge ? `${ageLabel(filters.minAge)} – ${ageLabel(filters.maxAge)}` : 'Edad', on: hasAge },
    { label: filters.sex ? SEX[filters.sex] : 'Sexo', on: !!filters.sex },
    { label: filters.zone ? zoneName(filters.zone) : 'Zona', on: !!filters.zone },
  ];
  const name = profile?.fullName?.split(' ')[0];
  const place = filters.zone ? zoneName(filters.zone) : 'Gran Caracas';

  const retry = <Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={() => load(filters)} />;

  const top = (
    <View style={styles.top}>
      <View style={styles.greet}>
        <View style={{ flex: 1 }}>
          <Text style={type.small}>Hola de nuevo,</Text>
          <Text style={type.h1} numberOfLines={1}>
            {name || 'Bienvenido a Petzo'}
          </Text>
        </View>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {profile?.avatarUrl ? <Image source={profile.avatarUrl} style={StyleSheet.absoluteFill} /> : <Text style={styles.initials}>{initials(profile?.fullName)}</Text>}
        </View>
      </View>

      <View style={styles.searchRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Buscar por zona, edad o tamaño" onPress={() => setSheet(true)} style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
          <Search size={20} color={color.muted} />
          <Text style={[type.body, { color: color.muted, flex: 1 }]} numberOfLines={1}>
            Busca por zona, edad o tamaño
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={n ? `Filtros, ${n} activos` : 'Filtros'} onPress={() => setSheet(true)} style={({ pressed }) => [styles.filter, pressed && [styles.pressed, { backgroundColor: color.inkPressed }]]}>
          <SlidersHorizontal size={20} color={color.canvas} />
          {n ? (
            <View style={styles.badge}>
              <Text style={[type.badge, { color: color.canvas }]}>{n}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.cats} accessibilityRole="radiogroup" accessibilityLabel="Especie">
        {CATEGORIES.map(([value, label, Icon, bg]) => {
          const on = filters.species === value;
          return (
            <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: on }} onPress={() => setSpecies(value)} style={styles.cat}>
              <View style={[styles.catRing, on && styles.catOn]}>
                <View style={[styles.catCircle, { backgroundColor: bg }]}>
                  <Icon size={26} color={color.ink} />
                </View>
              </View>
              <Text style={[styles.catLabel, on && { fontFamily: font.bold, color: color.ink }]}>{label}</Text>
            </Pressable>
          );
        })}
        <Pressable accessibilityRole="button" accessibilityLabel="Recomendados para ti" onPress={() => router.push('/match')} style={styles.cat}>
          <View style={styles.catRing}>
            <View style={[styles.catCircle, { backgroundColor: color.mint }]}>
              <Sparkles size={26} color={color.ink} />
            </View>
          </View>
          <Text style={styles.catLabel}>Match IA</Text>
        </Pressable>
      </View>

      {n ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipBar}>
          {chips
            .filter((c) => c.on)
            .map((c) => (
              <Chip key={c.label} label={c.label} on onPress={() => setSheet(true)} />
            ))}
          <Chip label="Limpiar" onPress={() => setFilters(DEFAULT_FILTERS)} />
        </ScrollView>
      ) : null}

      <View style={styles.section}>
        <Text style={type.h2} accessibilityRole="header">
          Para ti
        </Text>
        {status === 'ready' ? <Text style={type.small}>{`${total} en ${place}`}</Text> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {status === 'ready' && items.length ? (
        <FlashList
          data={items}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={top}
          renderItem={({ item, index }) => (
            <View style={index % 2 ? styles.right : styles.left}>
              <PetCard pet={item} zone={zoneName(item.municipalityId)} fav={favIds.has(item.id)} onOpen={onOpen} onFav={onFav} />
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingMore ? (
              <SkeletonRow />
            ) : items.length >= total ? (
              <Text style={[type.caption, styles.end]}>Eso es todo por ahora. Publican peludos nuevos todos los días.</Text>
            ) : null
          }
          onRefresh={() => load(filters)}
          refreshing={false}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {top}
          {status === 'loading' ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : status === 'error' ? (
            <StateView icon={CloudAlert} title="No pudimos cargar los peludos" body="Algo falló de nuestro lado. Tus filtros siguen guardados." action={retry} />
          ) : status === 'offline' ? (
            <StateView icon={WifiOff} title="Sin conexión" body="Revisa tus datos o el wifi. Cuando vuelva la señal te mostramos los peludos." action={retry} />
          ) : (
            <StateView
              icon={SearchX}
              title="No hay peludos con esos filtros"
              body="Prueba con otra zona o amplía el rango de edad."
              action={<Button label="Limpiar filtros" variant="secondary" onPress={() => setFilters(DEFAULT_FILTERS)} />}
            />
          )}
        </ScrollView>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  top: { paddingTop: 12, gap: 24, marginBottom: 16 },
  greet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: color.peach, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: color.canvas, ...shadow },
  initials: { fontFamily: font.bold, fontSize: 16, color: color.brandText },
  searchRow: { flexDirection: 'row', gap: 12 },
  search: { flex: 1, height: 52, borderRadius: radius.full, backgroundColor: color.canvas, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, ...shadow },
  filter: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 20, height: 20, borderRadius: radius.full, backgroundColor: color.brandText, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: color.cream },
  cats: { flexDirection: 'row', justifyContent: 'space-between' },
  cat: { alignItems: 'center', gap: 6, minWidth: 72 },
  catRing: { width: 72, height: 72, borderRadius: radius.full, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  catCircle: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  catOn: { borderColor: color.ink },
  skeletonCard: { flex: 1, backgroundColor: color.canvas, borderRadius: radius.md, overflow: 'hidden' },
  catLabel: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: color.body },
  chipBar: { flexGrow: 0, marginHorizontal: -20, marginVertical: -8 },
  chips: { gap: 8, paddingHorizontal: 20 },
  section: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  skeletonRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  left: { paddingRight: 8, paddingBottom: 16 },
  right: { paddingLeft: 8, paddingBottom: 16 },
  end: { textAlign: 'center', paddingTop: 8, paddingBottom: 16 },
});
