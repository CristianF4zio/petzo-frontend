import { Image } from 'expo-image';
import { router } from 'expo-router';
import { RefreshCw, SearchX, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { petMeta } from '@/components/PetCard';
import { Button, Field, FieldError, Header, Pill, Segmented, Skeleton, StateView } from '@/components/ui';
import { ApiError, api, type Lifestyle, type Pet, type Species } from '@/lib/api';
import { HOUSING, YES_NO, scoreColors } from '@/lib/format';
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
            <Skeleton key={i} style={{ height: 96, borderRadius: radius.md }} />
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
            result.matches.map(({ pet, score, reason }) => (
              <Pressable key={pet.id} accessibilityRole="button" accessibilityLabel={`Ver a ${pet.name}`} onPress={() => router.push(`/pet/${pet.id}`)} style={styles.card}>
                <Image source={pet.photos[0]?.url} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.row}>
                    <Text style={[type.title, { flex: 1 }]} numberOfLines={1}>
                      {pet.name}
                    </Text>
                    <Pill label={`${score}%`} fg={scoreColors(score)[0]} bg={scoreColors(score)[1]} />
                  </View>
                  <Text style={type.small}>{`${petMeta(pet)} · ${zoneName(pet.municipalityId)}`}</Text>
                  {reason ? <Text style={[type.small, { color: color.body }]}>{reason}</Text> : null}
                </View>
              </Pressable>
            ))
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
        <Text style={type.body}>Cuéntanos cómo vives y te recomendamos peludos compatibles. Tus respuestas también se usan para precargar tus solicitudes.</Text>
        {QUESTIONS.map((q) => (
          <Field key={q.key} label={q.label} error={missing && !form[q.key] ? 'Elige una opción.' : undefined}>
            <Segmented options={[...q.options]} value={form[q.key]} onChange={(v) => setForm((f) => ({ ...f, [q.key]: v }))} />
          </Field>
        ))}
        <Field label="¿Qué buscas? (opcional)">
          <Segmented
            options={[
              { value: 'dog', label: 'Perro' },
              { value: 'cat', label: 'Gato' },
            ]}
            value={species}
            onChange={(v) => setSpecies(species === v ? '' : v)}
          />
        </Field>
        <FieldError message={error} />
        <Button label="Ver recomendados" icon={Sparkles} onPress={run} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.md, padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: color.strong },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
