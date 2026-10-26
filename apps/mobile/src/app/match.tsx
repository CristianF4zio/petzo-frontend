import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, RefreshCw, SearchX, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { petMeta } from '@/components/PetCard';
import { Button, FieldError, Header, Pill, Segmented, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, type Lifestyle, type Pet, type Species } from '@/lib/api';
import { HOUSING, YES_NO } from '@/lib/format';
import { useSession } from '@/lib/session';
import { color, radius, type } from '@/lib/theme';

type Match = { pet: Pet; score: number; reason: string };
type Form = { [K in keyof Lifestyle]: Lifestyle[K] extends boolean ? 'si' | 'no' | '' : Lifestyle[K] | '' };

const QUESTIONS = [
  { key: 'housing', label: '¿Dónde vives?', options: HOUSING },
  { key: 'timeAtHome', label: '¿Cuánto tiempo pasas en casa?', options: [{ value: 'poco', label: 'Poco' }, { value: 'medio', label: 'Medio' }, { value: 'mucho', label: 'Mucho' }] },
  { key: 'kids', label: '¿Hay niños en casa?', options: YES_NO },
  { key: 'otherPets', label: '¿Tienes otras mascotas?', options: YES_NO },
  { key: 'experience', label: '¿Experiencia con mascotas?', options: [{ value: 'ninguna', label: 'Ninguna' }, { value: 'algo', label: 'Algo' }, { value: 'mucha', label: 'Mucha' }] },
] as const;
const EMPTY: Form = { housing: '', timeAtHome: '', kids: '', otherPets: '', experience: '' };

// HU-06: lifestyle questionnaire (RF-12) → up to 10 compatible pets with % and a short reason (RF-13); can be repeated
export default function MatchScreen() {
  const { zoneName } = useSession();
  const [form, setForm] = useState<Form>(EMPTY);
  const [species, setSpecies] = useState<Species | ''>('');
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ matches: Match[]; aiAvailable: boolean } | null>(null);

  useEffect(() => {
    // prefill only if the user hasn't started answering (slow network)
    api<Lifestyle | null>('/me/lifestyle').then(
      (l) => l && setForm((f) => (Object.values(f).some(Boolean) ? f : { ...l, kids: l.kids ? 'si' : 'no', otherPets: l.otherPets ? 'si' : 'no' })),
      () => {},
    );
  }, []);

  const run = async () => {
    const incomplete = Object.values(form).some((v) => !v);
    setMissing(incomplete);
    if (incomplete) return;
    setBusy(true);
    setError(undefined);
    try {
      await api('/me/lifestyle', { method: 'PUT', body: { ...form, kids: form.kids === 'si', otherPets: form.otherPets === 'si' } });
      setResult(await api('/match', { method: 'POST', body: species ? { species } : {} }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos buscar recomendaciones. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Recomendados para ti" />
        <View style={styles.body}>
          <Text style={type.small}>Buscando peludos compatibles…</Text>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ height: 104, borderRadius: radius.md }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (result) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Recomendados para ti" onBack={() => setResult(null)} />
        <ScrollView contentContainerStyle={styles.body}>
          {!result.aiAvailable ? (
            <StateView
              icon={SearchX}
              title="Las recomendaciones no están disponibles ahora"
              body="Guardamos tus respuestas. Mientras tanto, explora el catálogo con filtros."
              action={<Button label="Ir al catálogo" variant="secondary" onPress={() => router.navigate('/')} />}
            />
          ) : result.matches.length === 0 ? (
            <StateView icon={SearchX} title="No encontramos peludos compatibles" body="Prueba sin filtrar por especie o vuelve más tarde: entran peludos nuevos cada día." />
          ) : (
            <>
              <View style={styles.intro}>
                <Sparkles size={20} color={color.ink} />
                <Text style={[type.small, { color: color.body, flex: 1 }]}>{`${result.matches.length} peludos compatibles con tu estilo de vida, del más al menos afín.`}</Text>
              </View>
              {result.matches.map(({ pet, score, reason }) => (
                <Pressable
                  key={pet.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver a ${pet.name}, ${score}% compatible`}
                  onPress={() => router.push(`/pet/${pet.id}`)}
                  style={({ pressed }) => [styles.card, pressed && { backgroundColor: color.soft }]}
                >
                  <Image source={pet.photos[0]?.url} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.row}>
                      <Text style={[type.title, { flex: 1 }]} numberOfLines={1}>
                        {pet.name}
                      </Text>
                      <Pill label={`${score}% afín`} fg={color.ink} bg={color.mint} />
                    </View>
                    <Text style={type.caption} numberOfLines={1}>{`${petMeta(pet)} · ${zoneName(pet.municipalityId)}`}</Text>
                    {reason ? <Text style={[type.small, { color: color.body }]}>{reason}</Text> : null}
                  </View>
                  <ChevronRight size={20} color={color.muted} />
                </Pressable>
              ))}
            </>
          )}
          <Button label="Repetir cuestionario" variant="secondary" icon={RefreshCw} onPress={() => setResult(null)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title="Encuentra tu peludo ideal" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Sparkles size={20} color={color.ink} />
          <Text style={[type.small, { color: color.body, flex: 1 }]}>Cuéntanos cómo vives y te recomendamos peludos compatibles. Tus respuestas también se usan para precargar tus solicitudes.</Text>
        </View>
        {QUESTIONS.map((q) => (
          <View key={q.key} style={styles.section}>
            <Text style={type.title}>{q.label}</Text>
            <Segmented options={[...q.options]} value={form[q.key]} onChange={(v) => setForm((f) => ({ ...f, [q.key]: v }))} />
            <FieldError message={missing && !form[q.key] ? 'Elige una opción.' : undefined} />
          </View>
        ))}
        <View style={styles.section}>
          <Text style={type.title}>¿Qué buscas?</Text>
          <Text style={type.small}>Opcional. Toca de nuevo para quitarlo.</Text>
          <Segmented
            options={[
              { value: 'dog', label: 'Perro' },
              { value: 'cat', label: 'Gato' },
            ]}
            value={species}
            onChange={(v) => setSpecies(species === v ? '' : v)}
          />
        </View>
        <FieldError message={error} />
        <Button label="Ver recomendados" icon={Sparkles} onPress={run} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 16 },
  intro: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: color.mint, borderRadius: radius.lg, padding: 16 },
  section: { backgroundColor: color.soft, borderRadius: radius.lg, padding: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, padding: 12, backgroundColor: color.canvas },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: color.strong },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
