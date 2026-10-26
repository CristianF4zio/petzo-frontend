import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Cat, Check, Dog, Lock, MapPin, Plus, ShieldCheck, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoGrid, type Tile } from '@/components/PhotoGrid';
import { Button, Chip, Field, FieldError, Footer, IconCircle, Input, OptionSheet, Pill, Segmented, SelectButton } from '@/components/ui';
import { ApiError, api, upload as uploadFile, type Pet, type Sex, type Size, type Species } from '@/lib/api';
import { PLAN_LIMITS, SEX, SIZE, ageText, gendered, isActive } from '@/lib/format';
import { pickPhotos } from '@/lib/photos';
import { useSession } from '@/lib/session';
import { color, font, radius, shadow, type } from '@/lib/theme';
import { useToast } from '@/lib/toast';

const TITLES = ['Fotos', 'Datos', 'Salud y descripción', 'Revisar y enviar'];
const HEALTH = [
  ['vaccinated', 'Vacunad'],
  ['sterilized', 'Esterilizad'],
  ['dewormed', 'Desparasitad'],
] as const;
type Health = Record<(typeof HEALTH)[number][0], boolean>;
const SPECIES = [
  ['dog', 'Perro', Dog, color.peach],
  ['cat', 'Gato', Cat, color.sky],
] as const;

type Form = { species: Species; name: string; years: number; months: number; sex: Sex | ''; size: Size | ''; zone: number | null; health: Health; description: string };
type Errors = Partial<Record<'name' | 'sex' | 'size' | 'zone' | 'description' | 'step', string>>;

const emptyForm = (zone: number | null): Form => ({
  species: 'dog',
  name: '',
  years: 0,
  months: 3,
  sex: '',
  size: '',
  zone,
  health: { vaccinated: false, sterilized: false, dewormed: false },
  description: '',
});

export default function Publish() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { profile, isComplete, zoneName, municipalities, refreshProfile } = useSession();
  const say = useToast();
  const [step, setStep] = useState(1);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm(profile?.municipalityId ?? null));
  const [errors, setErrors] = useState<Errors>({});
  const [petId, setPetId] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [picker, setPicker] = useState<'years' | 'months' | 'zone' | null>(null);
  const [busy, setBusy] = useState(false);
  const limit = PLAN_LIMITS[profile?.plan ?? 'free'];
  const missing = !profile || !municipalities.length; // startup load failed (offline)
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  // The tab can mount before the profile loads or gets its zone
  const profileZone = profile?.municipalityId;
  useEffect(() => {
    if (profileZone) setForm((f) => (f.zone ? f : { ...f, zone: profileZone }));
  }, [profileZone]);

  const reset = useCallback(() => {
    setStep(1);
    setTiles([]);
    setSelected(null);
    setForm(emptyForm(profile?.municipalityId ?? null));
    setErrors({});
    setPetId(null);
  }, [profile?.municipalityId]);

  useFocusEffect(
    useCallback(() => {
      api<Pet[]>('/me/pets').then((pets) => setActive(pets.filter((p) => isActive(p.status)).length), () => {});
      if (missing) refreshProfile().catch(() => {});
      if (!editId || editId === petId) return;
      api<Pet>(`/pets/${editId}`).then(
        (p) => {
          setPetId(p.id);
          setStep(1);
          setErrors({});
          setTiles(p.photos.map((ph) => ({ key: ph.id, uri: ph.url, path: ph.path, status: 'ok' })));
          setForm({
            species: p.species,
            name: p.name,
            years: Math.floor(p.ageMonths / 12),
            months: p.ageMonths % 12,
            sex: p.sex,
            size: p.size,
            zone: p.municipalityId,
            health: { vaccinated: p.vaccinated, sterilized: p.sterilized, dewormed: p.dewormed },
            description: p.description ?? '',
          });
        },
        () => say('No pudimos abrir la publicación.'),
      );
    }, [editId, petId, say, missing, refreshProfile]),
  );

  const addPhotos = async () => {
    try {
      const picked = await pickPhotos(5 - tiles.length);
      setTiles((t) => [...t, ...picked.map((p, i) => ({ key: `${Date.now()}-${i}`, uri: p.uri, status: 'local' as const }))]);
      setErrors({});
    } catch {
      say('No pudimos abrir tus fotos.');
    }
  };

  // Uploads the given tiles through the API; returns key → storage path for the ones that made it.
  // Nothing is saved on the pet until PUT /photos.
  const upload = async (id: string, keys: string[]): Promise<Record<string, string>> => {
    setTiles((t) => t.map((x) => (keys.includes(x.key) ? { ...x, status: 'up' } : x)));
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const { path } = await uploadFile<{ path: string }>(`/pets/${id}/photos/upload`, tiles.find((x) => x.key === key)!.uri);
          return [key, path] as const;
        } catch {
          return [key, undefined] as const;
        }
      }),
    );
    const done = Object.fromEntries(results.filter(([, path]) => path)) as Record<string, string>;
    setTiles((t) => t.map((x) => (keys.includes(x.key) ? { ...x, path: done[x.key], status: done[x.key] ? 'ok' : 'fail' } : x)));
    return done;
  };

  // The next submit uploads it again
  const retry = (key: string) => setTiles((t) => t.map((x) => (x.key === key ? { ...x, status: 'local' } : x)));

  const validate = (): Errors => {
    const e: Errors = {};
    if (step === 1) {
      if (!tiles.length) e.step = 'Sube al menos una foto.';
      else if (tiles.some((t) => t.status === 'up')) e.step = 'Espera a que terminen de subir las fotos.';
      else if (tiles.some((t) => t.status === 'fail')) e.step = 'Reintenta o quita la foto que no se subió.';
    }
    if (step === 2) {
      if (!form.name.trim()) e.name = 'Escribe su nombre.';
      if (!form.sex) e.sex = 'Elige el sexo.';
      if (!form.size) e.size = 'Elige un tamaño.';
      if (!form.zone) e.zone = 'Elige el municipio.';
    }
    if (step === 3 && form.description.trim().length < 30) e.description = 'Escribe al menos 30 caracteres.';
    return e;
  };

  const submit = async () => {
    setBusy(true);
    const body = {
      species: form.species,
      name: form.name.trim(),
      ageMonths: form.years * 12 + form.months,
      sex: form.sex,
      size: form.size,
      municipalityId: form.zone,
      ...form.health,
      description: form.description.trim(),
    };
    try {
      let id = petId;
      if (id) await api(`/pets/${id}`, { method: 'PUT', body });
      else {
        id = (await api<Pet>('/pets', { method: 'POST', body })).id;
        setPetId(id);
      }
      const uploaded = await upload(id, tiles.filter((t) => !t.path).map((t) => t.key));
      const paths = tiles.map((t) => t.path ?? uploaded[t.key]);
      if (paths.some((p) => !p)) {
        setStep(1);
        setErrors({ step: 'Reintenta o quita la foto que no se subió.' });
        return;
      }
      // Whole gallery in one call: adds, removals and cover order land together
      await api(`/pets/${id}/photos`, { method: 'PUT', body: { paths } });
      try {
        await api(`/pets/${id}/status`, { method: 'PATCH', body: { status: 'pending_review' } });
      } catch (e) {
        // Drafts (new or imported) need this; an edited published pet is already back in review
        if (!(e instanceof ApiError && e.code === 'INVALID_STATUS')) throw e;
      }
      say(`Enviamos a ${body.name} a revisión. Te avisamos en minutos.`);
      reset();
      router.setParams({ editId: undefined }); // the tab keeps its params; don't reopen this pet next time
      router.replace('/mine');
    } catch (e) {
      setErrors({ step: e instanceof ApiError ? e.message : 'No pudimos enviar la publicación. Intenta de nuevo.' });
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < 4) {
      setStep(step + 1);
      setSelected(null);
    } else submit();
  };

  if (!isComplete) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Top title="Publicar" subtitle="Cuéntanos de tu peludo" />
        <View style={styles.blocked}>
          <IconCircle icon={UserRound} />
          <Text style={[type.h2, styles.center, { marginTop: 4 }]}>Completa tu perfil primero</Text>
          <Text style={[type.body, styles.center, { color: color.muted }]}>Necesitamos tu zona y tu WhatsApp para conectarte con quien quiera adoptar.</Text>
          <Button label="Completar perfil" onPress={() => router.push({ pathname: '/profile-setup', params: { next: 'publish' } })} style={styles.stretch} />
        </View>
      </SafeAreaView>
    );
  }

  if (!petId && active >= limit) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Top title="Publicar" subtitle="Cuéntanos de tu peludo" />
        <View style={styles.blocked}>
          <IconCircle icon={Lock} />
          <Text style={[type.h2, styles.center, { marginTop: 4 }]}>{`Llegaste a tu límite de ${limit} publicaciones activas`}</Text>
          <Text style={[type.body, styles.center, { color: color.muted }]}>Pausa una publicación o márcala como adoptada para publicar otra. Con el plan Pro tienes hasta 30 activas.</Text>
          <Button label="Ir a Mis publicaciones" onPress={() => router.push('/mine')} style={styles.stretch} />
          <Button label="Conocer el plan Pro" variant="text" onPress={() => say('El plan Pro llega pronto. Te avisamos.')} style={{ alignSelf: 'center' }} />
        </View>
      </SafeAreaView>
    );
  }

  const healthLabels = HEALTH.filter(([k]) => form.health[k]).map(([, l]) => gendered(l, form.sex));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Top
        title={petId ? 'Editar' : 'Publicar'}
        subtitle={petId ? `Estás editando a ${form.name || 'tu peludo'}` : 'Cuéntanos de tu peludo'}
        right={
          petId ? (
            <Button
              label="Cancelar edición"
              variant="text"
              disabled={busy}
              onPress={() => {
                // params first, so the focus effect doesn't reload the pet in between
                router.setParams({ editId: undefined });
                reset();
              }}
            />
          ) : null
        }
      />
      <View style={styles.steps}>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel={`Paso ${step} de 4`}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.bar, { backgroundColor: i <= step ? color.brand : color.hairline }]} />
          ))}
        </View>
        <View style={styles.row}>
          <Text style={type.title}>{TITLES[step - 1]}</Text>
          <Text style={type.caption}>{`Paso ${step} de 4`}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={type.title}>Fotos</Text>
                <Pill label={`${tiles.length}/5`} fg={tiles.length ? '#166534' : color.ink} bg={tiles.length ? color.mint : color.sand} />
              </View>
              <Text style={type.small}>Sube de 1 a 5 fotos tomadas por ti. La primera es la portada; toca una foto para moverla.</Text>
              <PhotoGrid
                tiles={tiles}
                selected={selected}
                onSelect={setSelected}
                onAdd={addPhotos}
                onRetry={retry}
                onRemove={(key) => {
                  setTiles((t) => t.filter((x) => x.key !== key));
                  setSelected(null);
                }}
                onMove={(from, to) =>
                  setTiles((t) => {
                    const copy = t.slice();
                    const [x] = copy.splice(from, 1);
                    copy.splice(to, 0, x!);
                    return copy;
                  })
                }
              />
            </View>
          ) : null}

          {step === 2 ? (
            <>
              <Section title="¿Quién es?">
                <View style={styles.two} accessibilityRole="radiogroup" accessibilityLabel="Especie">
                  {SPECIES.map(([value, label, Icon, bg]) => {
                    const on = form.species === value;
                    return (
                      <Pressable
                        key={value}
                        accessibilityRole="radio"
                        accessibilityLabel={label}
                        accessibilityState={{ checked: on }}
                        onPress={() => set({ species: value })}
                        style={({ pressed }) => [styles.species, { backgroundColor: bg }, on && styles.speciesOn, pressed && { opacity: 0.8 }]}
                      >
                        <View style={styles.speciesIcon}>
                          <Icon size={24} color={color.ink} />
                        </View>
                        <Text style={type.title}>{label}</Text>
                        {on ? (
                          <View style={styles.check}>
                            <Check size={14} color={color.canvas} strokeWidth={3} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
                <Field label="Nombre" error={errors.name}>
                  <Input value={form.name} onChangeText={(v) => set({ name: v })} placeholder="¿Cómo se llama?" error={!!errors.name} maxLength={60} style={styles.sand} />
                </Field>
                <View style={styles.field}>
                  <Text style={type.label}>Edad aproximada</Text>
                  <View style={styles.two}>
                    <View style={{ flex: 1 }}>
                      <SelectButton value={`${form.years} ${form.years === 1 ? 'año' : 'años'}`} placeholder="Años" onPress={() => setPicker('years')} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <SelectButton value={`${form.months} ${form.months === 1 ? 'mes' : 'meses'}`} placeholder="Meses" onPress={() => setPicker('months')} />
                    </View>
                  </View>
                </View>
              </Section>

              <Section title="Sexo y tamaño">
                <View style={styles.field}>
                  <Text style={type.label}>Sexo</Text>
                  <Segmented
                    options={[
                      { value: 'male', label: 'Macho' },
                      { value: 'female', label: 'Hembra' },
                    ]}
                    value={form.sex}
                    onChange={(v) => {
                      set({ sex: v });
                      setErrors((e) => ({ ...e, sex: undefined }));
                    }}
                  />
                  <FieldError message={errors.sex} />
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={type.label}>Tamaño</Text>
                  <View style={styles.wrap}>
                    {(Object.keys(SIZE) as Size[]).map((s) => (
                      <Chip
                        key={s}
                        label={SIZE[s]}
                        on={form.size === s}
                        onPress={() => {
                          set({ size: s });
                          setErrors((e) => ({ ...e, size: undefined }));
                        }}
                      />
                    ))}
                  </View>
                  <FieldError message={errors.size} />
                </View>
              </Section>

              <Section title="Zona" hint="Tomada de tu perfil. Cámbiala si el peludo está en otra zona.">
                <SelectButton icon={MapPin} value={zoneName(form.zone)} placeholder="Elige el municipio" onPress={() => setPicker('zone')} error={!!errors.zone} />
                <FieldError message={errors.zone} />
              </Section>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Section title="Salud" hint="Marca lo que aplica.">
                <View style={styles.wrap}>
                  {HEALTH.map(([k, l]) => (
                    <Chip key={k} label={gendered(l, form.sex)} icon={form.health[k] ? Check : Plus} on={form.health[k]} onPress={() => set({ health: { ...form.health, [k]: !form.health[k] } })} />
                  ))}
                </View>
              </Section>
              <Section title="Descripción" hint="Cuenta cómo es, qué le gusta y qué tipo de hogar busca.">
                <TextInput
                  accessibilityLabel="Descripción"
                  value={form.description}
                  onChangeText={(v) => set({ description: v })}
                  maxLength={1000}
                  multiline
                  placeholder="Ej.: Es juguetón, se lleva bien con niños y busca un hogar con patio."
                  placeholderTextColor={color.muted}
                  style={[styles.textarea, errors.description && { borderColor: color.error }]}
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <FieldError message={errors.description} />
                  </View>
                  <Text style={type.caption}>{`${form.description.length}/1000`}</Text>
                </View>
              </Section>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <View style={styles.review}>
                <Image source={tiles[0]?.uri} style={styles.reviewPhoto} contentFit="cover" />
                <View style={{ padding: 16, gap: 4 }}>
                  <Text style={type.h2}>{form.name}</Text>
                  <Text style={type.small}>{`${ageText(form.years * 12 + form.months)} · ${form.sex ? SEX[form.sex] : '—'} · ${form.size ? SIZE[form.size] : '—'}`}</Text>
                  <Text style={type.small}>{`${zoneName(form.zone)} · ${tiles.length === 1 ? '1 foto' : `${tiles.length} fotos`}`}</Text>
                  <Text style={[type.small, { color: color.body, marginTop: 4 }]}>{healthLabels.join(' · ') || 'Sin datos de salud'}</Text>
                </View>
              </View>
              <View style={[styles.section, styles.note]}>
                <View style={styles.noteIcon}>
                  <ShieldCheck size={20} color={color.ink} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={type.title}>Lo revisamos en minutos para evitar fraudes</Text>
                  <Text style={type.small}>Te avisamos cuando esté publicada o si hay que corregir algo.</Text>
                </View>
              </View>
              {petId ? null : (
                <View style={{ gap: 8 }}>
                  <Text style={type.small}>{`Tienes ${active} de ${limit} publicaciones activas`}</Text>
                  <View style={styles.quota}>
                    <View style={{ height: '100%', width: `${Math.min(100, (active / limit) * 100)}%`, backgroundColor: color.brand }} />
                  </View>
                </View>
              )}
            </>
          ) : null}

          <FieldError message={errors.step} />
        </ScrollView>
        <Footer>
          <View style={styles.footerRow}>
            {step > 1 && !busy ? <Button label="Atrás" variant="secondary" style={styles.back} onPress={() => (setStep(step - 1), setErrors({}))} /> : null}
            <Button label={busy ? 'Enviando…' : step === 4 ? 'Publicar' : 'Continuar'} onPress={next} disabled={busy} style={{ flex: 1 }} />
          </View>
        </Footer>
      </KeyboardAvoidingView>

      <OptionSheet
        visible={picker === 'years'}
        title="Años"
        options={Array.from({ length: 16 }, (_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'año' : 'años'}` }))}
        value={String(form.years)}
        onPick={(v) => set({ years: Number(v) })}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'months'}
        title="Meses"
        options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'mes' : 'meses'}` }))}
        value={String(form.months)}
        onPick={(v) => set({ months: Number(v) })}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'zone'}
        title="Municipio"
        options={municipalities.map((m) => ({ value: String(m.id), label: m.name }))}
        value={String(form.zone ?? '')}
        onPick={(v) => {
          set({ zone: Number(v) });
          setErrors((e) => ({ ...e, zone: undefined }));
        }}
        onClose={() => setPicker(null)}
      />
    </SafeAreaView>
  );
}

function Top({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  return (
    <View style={styles.top}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.h1} accessibilityRole="header">
          {title}
        </Text>
        <Text style={type.small} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {right}
    </View>
  );
}

// Form groups sit on white: the ui.tsx inputs, chips and segmented are soft-filled
function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={{ gap: 2 }}>
        <Text style={type.title}>{title}</Text>
        {hint ? <Text style={type.small}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.cream },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  blocked: { marginHorizontal: 20, padding: 24, gap: 12, alignItems: 'center', backgroundColor: color.canvas, borderRadius: radius.lg, ...shadow },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: 8 },
  steps: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  progress: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: radius.full },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 16 },
  // white cards on cream; fields inside are sand-filled
  section: { padding: 16, gap: 12, borderRadius: radius.lg, backgroundColor: color.canvas, ...shadow },
  sand: { backgroundColor: color.sand }, // no borderColor: Input's error border must win
  back: { paddingHorizontal: 20 },
  field: { gap: 8 },
  two: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  species: { flex: 1, height: 112, padding: 14, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', justifyContent: 'space-between' },
  speciesOn: { borderColor: color.ink },
  speciesIcon: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: radius.full, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' },
  textarea: { height: 180, borderWidth: 1, borderColor: color.sand, borderRadius: radius.md, backgroundColor: color.sand, padding: 16, fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: color.ink, textAlignVertical: 'top' },
  review: { borderRadius: radius.lg, backgroundColor: color.canvas, ...shadow },
  reviewPhoto: { aspectRatio: 16 / 9, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: color.sand },
  note: { flexDirection: 'row', alignItems: 'flex-start' },
  noteIcon: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: color.mint, alignItems: 'center', justifyContent: 'center' },
  quota: { height: 6, borderRadius: radius.full, backgroundColor: color.hairline, overflow: 'hidden' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
