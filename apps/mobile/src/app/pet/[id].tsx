import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Cake, CircleCheck, CircleDashed, Clock, CloudAlert, Flag, Lock, MapPin, Mars, MessageCircle, RefreshCw, Ruler, Syringe, Venus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeartIcon } from '@/components/PetCard';
import { RequestSheet } from '@/components/RequestSheet';
import { Button, Chip, Footer, Header, RoundButton, Sheet, Skeleton, StateView, VerifiedBadge } from '@/components/ui';
import { ApiError, api, openContact, type MyRequest, type Pet } from '@/lib/api';
import { SEX, SIZE, ageText, gendered, initials } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

const REASONS = ['Fotos de internet', 'Parece una venta', 'Datos falsos', 'Otro motivo'];
const PHOTO_H = 320;

export default function PetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const { zoneName, favIds, toggleFav, profile, isComplete } = useSession();
  const say = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [myReq, setMyReq] = useState<MyRequest | null>(null); // latest own request for this pet
  const galleryW = width - 32;

  const load = useCallback(() => {
    setFailed(false);
    api<Pet>(`/pets/${id}`).then(setPet, () => setFailed(true));
  }, [id]);
  useEffect(load, [load]);

  // shortcut: reads the whole /me/requests list to find this pet; add GET /pets/{id}/my-request if histories grow
  const loadRequest = useCallback(() => {
    api<MyRequest[]>('/me/requests').then((rs) => setMyReq(rs.find((r) => r.petId === id) ?? null), () => {});
  }, [id]);
  useFocusEffect(loadRequest);

  const openWhatsapp = (requestId: string, petName: string) =>
    openContact(requestId, petName, 'aprobaron mi solicitud').catch((e) =>
      say(e instanceof ApiError ? e.message : 'No pudimos abrir WhatsApp.'),
    );

  const report = async (reason: string) => {
    setReporting(false);
    try {
      await api(`/pets/${id}/reports`, { method: 'POST', body: { reason } });
      say('Gracias. Revisaremos esta publicación.');
    } catch (e) {
      say(e instanceof ApiError ? e.message : 'No pudimos enviar el reporte.');
    }
  };

  if (failed) {
    return (
      <SafeAreaView style={styles.root}>
        <Header title="Detalle" />
        <StateView icon={CloudAlert} title="No pudimos cargar este peludo" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
      </SafeAreaView>
    );
  }
  if (!pet) {
    return (
      <SafeAreaView style={styles.root}>
        <Header title="Detalle" />
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Skeleton style={{ height: PHOTO_H, borderRadius: radius.lg }} />
          <Skeleton style={{ height: 28, width: '50%', marginTop: 8 }} />
          <Skeleton style={{ height: 14, width: '35%' }} />
          <View style={styles.facts}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ flex: 1, height: 88, borderRadius: radius.md }} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const fav = favIds.has(pet.id);
  const pub = pet.publisher;
  const pubName = pub.name || 'Publicador';
  const short = pet.name.split(' ')[0];
  const own = pub.id === profile?.id;
  const health = [
    pet.vaccinated ? { Icon: Syringe, label: gendered('Vacunad', pet.sex), ok: true } : { Icon: CircleDashed, label: 'Sin vacunas', ok: false },
    pet.sterilized ? { Icon: CircleCheck, label: gendered('Esterilizad', pet.sex), ok: true } : { Icon: CircleDashed, label: 'Sin esterilizar', ok: false },
    pet.dewormed ? { Icon: CircleCheck, label: gendered('Desparasitad', pet.sex), ok: true } : { Icon: CircleDashed, label: 'Sin desparasitar', ok: false },
  ];
  const facts = [
    { Icon: pet.sex === 'female' ? Venus : Mars, value: SEX[pet.sex], label: 'Sexo', bg: color.peach },
    { Icon: Cake, value: ageText(pet.ageMonths), label: 'Edad', bg: color.sky },
    { Icon: Ruler, value: SIZE[pet.size], label: 'Tamaño', bg: color.mint },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header
        title="Detalle"
        right={
          <RoundButton label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'} onPress={() => toggleFav(pet.id).catch(() => say('No pudimos guardar el favorito.'))}>
            <HeartIcon on={fav} />
          </RoundButton>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: own ? bottom + 24 : 24 }}>
        <View style={styles.gallery}>
          <FlatList
            data={pet.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(ph) => ph.id}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / galleryW))}
            renderItem={({ item, index }) => (
              <Image source={item.url} style={{ width: galleryW, height: PHOTO_H }} contentFit="cover" accessibilityLabel={`Foto ${index + 1} de ${pet.photos.length} de ${pet.name}`} />
            )}
          />
          {pet.photos.length > 1 ? (
            <View style={styles.dots} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {pet.photos.map((ph, i) => (
                <View key={ph.id} style={[styles.dot, i === idx && styles.dotOn]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={{ gap: 6 }}>
            <View style={styles.nameRow}>
              <Text style={[type.h1, { flexShrink: 1 }]}>{pet.name}</Text>
              {pet.publisher.verified ? <VerifiedBadge /> : null}
            </View>
            <View style={styles.row}>
              <MapPin size={16} color={color.muted} />
              <Text style={type.small}>{`${zoneName(pet.municipalityId)} · Gran Caracas`}</Text>
            </View>
          </View>
          <View style={styles.facts}>
            {facts.map(({ Icon, value, label, bg }) => (
              <View key={label} style={styles.fact} accessible accessibilityLabel={`${label}: ${value}`}>
                <View style={[styles.factIcon, { backgroundColor: bg }]}>
                  <Icon size={18} color={color.ink} />
                </View>
                <Text style={[type.title, { textAlign: 'center' }]} numberOfLines={2}>
                  {value}
                </Text>
                <Text style={type.caption}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={type.h2}>Salud</Text>
            <View style={styles.wrap}>
              {health.map(({ Icon, label, ok }) => (
                <View key={label} style={[styles.health, { backgroundColor: ok ? color.mint : color.soft }]}>
                  <Icon size={16} color={color.ink} />
                  <Text style={styles.healthText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          {pet.description ? (
            <View style={{ gap: 8 }}>
              <Text style={type.h2}>{`Sobre ${short}`}</Text>
              <Text style={type.body}>{pet.description}</Text>
            </View>
          ) : null}
          <View style={styles.publisher}>
            <View style={styles.avatar}>
              {pub?.avatarUrl ? <Image source={pub.avatarUrl} style={StyleSheet.absoluteFill} /> : <Text style={styles.initials}>{initials(pubName)}</Text>}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={type.title}>{pubName}</Text>
              <Text style={type.small}>{`${zoneName(pub?.municipalityId)} · ${pub?.petsCount === 1 ? '1 publicación' : `${pub?.petsCount ?? 0} publicaciones`}`}</Text>
              {pet.publisher.verified ? <VerifiedBadge /> : <Text style={[type.badge, styles.particular]}>Particular</Text>}
            </View>
          </View>
          <View style={styles.note}>
            <Lock size={20} color={color.ink} />
            <Text style={[type.small, { color: color.body, flex: 1 }]}>El WhatsApp se muestra cuando el publicador apruebe tu solicitud.</Text>
          </View>
          {own ? null : (
            <Pressable accessibilityRole="button" onPress={() => setReporting(true)} style={styles.report}>
              <Flag size={16} color={color.muted} />
              <Text style={[type.small, { textDecorationLine: 'underline' }]}>Reportar publicación</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      {own ? null : (
        <Footer>
          {myReq?.status === 'approved' ? (
            <Button label="Escribir por WhatsApp" icon={MessageCircle} onPress={() => openWhatsapp(myReq.id, pet.name)} />
          ) : myReq?.status === 'pending' ? (
            <Button label="Solicitud enviada · pendiente" icon={Clock} variant="secondary" disabled onPress={() => {}} />
          ) : (
            <Button
              label={pet.sex === 'female' ? 'Quiero adoptarla' : 'Quiero adoptarlo'}
              onPress={() => (isComplete ? setAsking(true) : router.push('/profile-setup'))}
            />
          )}
        </Footer>
      )}
      <RequestSheet visible={asking} petId={pet.id} petName={short} pubName={pubName} onClose={() => setAsking(false)} onSent={loadRequest} />
      <Sheet visible={reporting} title="Reportar publicación" onClose={() => setReporting(false)}>
        <Text style={type.body}>¿Qué notaste? Lo revisamos y, si hace falta, la retiramos.</Text>
        <View style={styles.wrap}>
          {REASONS.map((r) => (
            <Chip key={r} label={r} onPress={() => report(r)} />
          ))}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  gallery: { marginHorizontal: 16, height: PHOTO_H, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.strong },
  dots: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { width: 20, backgroundColor: color.canvas },
  body: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: color.soft, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 8 },
  factIcon: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  health: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.full },
  healthText: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  publisher: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.soft, borderRadius: radius.md, padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: color.peach, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { fontFamily: font.bold, fontSize: 16, color: color.brand },
  particular: { alignSelf: 'flex-start', color: color.body, backgroundColor: color.canvas, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 6, overflow: 'hidden' },
  note: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: color.butter, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, alignSelf: 'flex-start' },
});
