import { Lock, Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, api, type Lifestyle } from '@/lib/api';
import { HOUSING, YES_NO } from '@/lib/format';
import { color, font, radius, type } from '@/lib/theme';
import { Button, Field, FieldError, IconCircle, Segmented, Sheet } from './ui';


type Props = { visible: boolean; petId: string; petName: string; pubName: string; onClose: () => void; onSent: () => void };
type Errors = Partial<Record<'housing' | 'otherPets' | 'motivation' | 'form', string>>;

// HU-07: adoption request form (design sheet 10). Answers are prefilled from the lifestyle questionnaire (RF-12).
export function RequestSheet({ visible, petId, petName, pubName, onClose, onSent }: Props) {
  const [housing, setHousing] = useState<Lifestyle['housing'] | ''>('');
  const [otherPets, setOtherPets] = useState<'si' | 'no' | ''>('');
  const [motivation, setMotivation] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDone(false);
    setErrors({});
    api<Lifestyle | null>('/me/lifestyle').then((l) => {
      if (!l) return;
      setHousing((h) => h || l.housing);
      setOtherPets((o) => o || (l.otherPets ? 'si' : 'no'));
    }, () => {});
  }, [visible]);

  const send = async () => {
    const e: Errors = {};
    if (!housing) e.housing = 'Elige una opción.';
    if (!otherPets) e.otherPets = 'Elige una opción.';
    if (motivation.trim().length < 20) e.motivation = 'Escribe al menos 20 caracteres.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api(`/pets/${petId}/requests`, { method: 'POST', body: { answers: { housing, otherPets: otherPets === 'si' }, motivation: motivation.trim() } });
      setDone(true);
      setMotivation('');
      onSent();
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'No pudimos enviar la solicitud. Intenta de nuevo.' });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Sheet visible={visible} onClose={onClose}>
        <View style={styles.done}>
          <IconCircle icon={Send} />
          <Text style={[type.h2, { textAlign: 'center' }]}>¡Solicitud enviada!</Text>
          <Text style={[type.body, { textAlign: 'center' }]}>{`${pubName} la va a revisar. Si la aprueba, verás su WhatsApp en la publicación de ${petName}.`}</Text>
          <Button label="Seguir explorando" variant="secondary" onPress={onClose} style={{ alignSelf: 'stretch' }} />
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} title="Solicitud de adopción" onClose={onClose} footer={<Button label={busy ? 'Enviando…' : 'Enviar solicitud'} disabled={busy} onPress={send} />}>
      <Text style={type.body}>{`Cuéntale a ${pubName} un poco sobre ti para adoptar a ${petName}.`}</Text>
      <Field label="¿Dónde vivirá?" error={errors.housing}>
        <Segmented options={[...HOUSING]} value={housing} onChange={setHousing} />
      </Field>
      <Field label="¿Tienes otras mascotas?" error={errors.otherPets}>
        <Segmented options={[...YES_NO]} value={otherPets} onChange={setOtherPets} />
      </Field>
      <Field label="¿Por qué quieres adoptar?" error={errors.motivation}>
        <TextInput
          value={motivation}
          onChangeText={setMotivation}
          maxLength={500}
          multiline
          placeholder="Tu rutina, quién vive contigo, cómo lo cuidarías…"
          placeholderTextColor={color.muted}
          style={[styles.textarea, errors.motivation ? { borderColor: color.error } : null]}
        />
        <Text style={[type.caption, { alignSelf: 'flex-end' }]}>{`${motivation.length}/500`}</Text>
      </Field>
      <View style={styles.note}>
        <Lock size={16} color={color.muted} />
        <Text style={[type.small, { flex: 1 }]}>Compartimos tu nombre y zona. Tu WhatsApp solo si aprueban la solicitud.</Text>
      </View>
      <FieldError message={errors.form} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: 120, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.sm, padding: 12, fontFamily: font.regular, fontSize: 16, color: color.ink, textAlignVertical: 'top' },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  done: { alignItems: 'center', gap: 16, paddingVertical: 24 },
});
