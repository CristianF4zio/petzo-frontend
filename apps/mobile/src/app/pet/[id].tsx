import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CircleCheck, CircleDashed, Clock, CloudAlert, Flag, Lock, MapPin, MessageCircle, RefreshCw, Syringe } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { HEART } from '@/components/PetCard';
import { RequestSheet } from '@/components/RequestSheet';
import { Button, Chip, Footer, Sheet, Skeleton, StateView, VerifiedBadge } from '@/components/ui';
import { ApiError, api, openContact, type MyRequest, type Pet } from '@/lib/api';
import { SEX, SIZE, ageText, gendered, initials } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, font, radius, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

const REASONS = ['Fotos de internet', 'Parece una venta', 'Datos falsos', 'Otro motivo'];

export default function PetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { zoneName, favIds, toggleFav, profile, isComplete } = useSession();
  const say = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [myReq, setMyReq] = useState<MyRequest | null>(null); // latest own request for this pet

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
        <StateView icon={CloudAlert} title="No pudimos cargar este peludo" action={<Button label="Reintentar" variant="secondary" icon={RefreshCw} onPress={load} />} />
      </SafeAreaView>
    );
  }
  if (!pet) {
    return (
      <SafeAreaView style={[styles.root, { padding: 16, gap: 12 }]}>
        <Skeleton style={{ height: 270, borderRadius: 0, marginHorizontal: -16, marginTop: -16 }} />
        <Skeleton style={{ height: 24, width: '50%' }} />
        <Skeleton style={{ height: 14, width: '35%' }} />
      </SafeAreaView>
    );
  }

  const fav = favIds.has(pet.id);
  const pub = pet.publisher;
  const pubName = pub.name || 'Publicador';
  const short = pet.name.split(' ')[0];
  const own = pub.id === profile?.id;
  const health = [
    pet.vaccinated ? { Icon: Syringe, label: gendered('Vacunad', pet.sex) } : { Icon: CircleDashed, label: 'Sin vacunas' },
    pet.sterilized ? { Icon: CircleCheck, label: gendered('Esterilizad', pet.sex) } : { Icon: CircleDashed, label: 'Sin esterilizar' },
    pet.dewormed ? { Icon: CircleCheck, label: gendered('Desparasitad', pet.sex) } : { Icon: CircleDashed, label: 'Sin desparasitar' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView>
        <View style={{ height: 270, backgroundColor: color.strong }}>
          <FlatList
            data={pet.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(ph) => ph.id}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => (
              <Image source={item.url} style={{ width, height: 270 }} contentFit="cover" accessibilityLabel={`Foto ${index + 1} de ${pet.photos.length} de ${pet.name}`} />
            )}
          />
          <SafeAreaView edges={['top']} style={styles.overlay} pointerEvents="box-none">
            <Pressable accessibilityRole="button" accessibilityLabel="Volver al catálogo" onPress={() => router.back()} style={styles.roundHit}>
              <View style={styles.round}>
                <ArrowLeft size={20} color={color.ink} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              onPress={() => toggleFav(pet.id).catch(() => say('No pudimos guardar el favorito.'))}
              style={styles.roundHit}
            >
              <View style={styles.round}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d={HEART} fill={fav ? color.brand : 'none'} stroke={fav ? color.brand : color.ink} strokeWidth={2} strokeLinejoin="round" />
                </Svg>
              </View>
            </Pressable>
          </SafeAreaView>
          <View style={styles.counter} pointerEvents="none">
            <Text style={styles.counterText}>{`${idx + 1}/${pet.photos.length}`}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ gap: 4 }}>
            <Text style={type.h1}>{pet.name}</Text>
            <View style={styles.row}>
              <MapPin size={14} color={color.muted} />
              <Text style={type.small}>{`${zoneName(pet.municipalityId)} · Gran Caracas`}</Text>
            </View>
          </View>
          <View style={styles.facts}>
            {[
              ['Edad', ageText(pet.ageMonths)],
              ['Sexo', SEX[pet.sex]],
              ['Tamaño', SIZE[pet.size]],
            ].map(([k, v]) => (
              <View key={k} style={{ flex: 1, gap: 4 }}>
                <Text style={type.caption}>{k}</Text>
                <Text style={type.title}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 12 }}>
            <Text style={type.h2}>Salud</Text>
            <View style={styles.wrap}>
              {health.map(({ Icon, label }) => (
                <View key={label} style={styles.health}>
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
              {pub?.avatarUrl ? <Image source={pub.avatarUrl} style={StyleSheet.absoluteFill} /> : <Text style={type.title}>{initials(pubName)}</Text>}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 8 },
  roundHit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  round: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: color.canvas, borderWidth: 1, borderColor: color.hairline, alignItems: 'center', justifyContent: 'center' },
  counter: { position: 'absolute', right: 12, bottom: 12, backgroundColor: color.scrim, borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: 10 },
  counterText: { fontFamily: font.medium, fontSize: 13, color: color.canvas },
  body: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  facts: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.hairline, paddingVertical: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  health: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: color.soft, borderWidth: 1, borderColor: color.hairline },
  healthText: { fontFamily: font.medium, fontSize: 14, color: color.ink },
  publisher: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, padding: 16 },
  avatar: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: color.strong, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  particular: { alignSelf: 'flex-start', color: color.body, backgroundColor: color.strong, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 6, overflow: 'hidden' },
  note: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: color.soft, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, alignSelf: 'flex-start' },
});
