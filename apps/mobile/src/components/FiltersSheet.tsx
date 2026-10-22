import { MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api, type Size } from '@/lib/api';
import { AGES, DEFAULT_FILTERS, ageLabel, toQuery, type Filters } from '@/lib/filters';
import { SIZE } from '@/lib/format';
import { useSession } from '@/lib/session';
import { type } from '@/lib/theme';
import { Button, Chip, OptionSheet, Segmented, SelectButton, Sheet } from './ui';

type Props = { visible: boolean; filters: Filters; onApply: (f: Filters) => void; onClose: () => void };
type Picker = 'min' | 'max' | 'zone' | null;

export function FiltersSheet({ visible, filters, onApply, onClose }: Props) {
  const { municipalities, zoneName } = useSession();
  const [draft, setDraft] = useState(filters);
  const [count, setCount] = useState<number | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  // "Ver N resultados" reflects the draft before applying it
  useEffect(() => {
    if (!visible) return;
    let live = true;
    const t = setTimeout(() => {
      api<{ pagination: { total: number } }>(toQuery(draft, 1)).then(
        (r) => live && setCount(r.pagination.total),
        () => live && setCount(null),
      );
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [draft, visible]);

  const toggleSize = (s: Size) => set({ sizes: draft.sizes.includes(s) ? draft.sizes.filter((x) => x !== s) : [...draft.sizes, s] });
  const applyLabel = count === null ? 'Ver resultados' : count ? `Ver ${count} resultados` : 'Sin resultados';

  return (
    <Sheet
      visible={visible}
      title="Filtros"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button label="Limpiar" variant="text" onPress={() => setDraft(DEFAULT_FILTERS)} />
          <Button label={applyLabel} disabled={count === 0} onPress={() => onApply(draft)} />
        </View>
      }
    >
      <View style={styles.group}>
        <Text style={type.title}>Especie</Text>
        <Segmented
          options={[
            { value: '', label: 'Todos' },
            { value: 'dog', label: 'Perros' },
            { value: 'cat', label: 'Gatos' },
          ]}
          value={draft.species}
          onChange={(v) => set({ species: v })}
        />
      </View>
      <View style={styles.group}>
        <Text style={type.title}>Sexo</Text>
        <Segmented
          options={[
            { value: '', label: 'Todos' },
            { value: 'male', label: 'Macho' },
            { value: 'female', label: 'Hembra' },
          ]}
          value={draft.sex}
          onChange={(v) => set({ sex: v })}
        />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={type.title}>Tamaño</Text>
        <View style={styles.wrap}>
          {(Object.keys(SIZE) as Size[]).map((s) => (
            <Chip key={s} label={SIZE[s]} on={draft.sizes.includes(s)} onPress={() => toggleSize(s)} />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text style={type.title}>Edad</Text>
        <View style={styles.ages}>
          <View style={styles.age}>
            <Text style={type.caption}>Desde</Text>
            <SelectButton value={ageLabel(draft.minAge)} placeholder="Desde" onPress={() => setPicker('min')} />
          </View>
          <View style={styles.age}>
            <Text style={type.caption}>Hasta</Text>
            <SelectButton value={ageLabel(draft.maxAge)} placeholder="Hasta" onPress={() => setPicker('max')} />
          </View>
        </View>
      </View>
      <View style={styles.group}>
        <Text style={type.title}>Zona</Text>
        <SelectButton icon={MapPin} value={draft.zone ? zoneName(draft.zone) : 'Toda Gran Caracas'} placeholder="Toda Gran Caracas" onPress={() => setPicker('zone')} />
      </View>

      <OptionSheet
        visible={picker === 'min' || picker === 'max'}
        title={picker === 'min' ? 'Desde' : 'Hasta'}
        options={AGES.filter((a) => (picker === 'min' ? a.value < draft.maxAge : a.value > draft.minAge)).map((a) => ({ value: String(a.value), label: a.label }))}
        value={String(picker === 'min' ? draft.minAge : draft.maxAge)}
        onPick={(v) => set(picker === 'min' ? { minAge: Number(v) } : { maxAge: Number(v) })}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'zone'}
        title="Municipio"
        options={[{ value: '', label: 'Toda Gran Caracas' }, ...municipalities.map((m) => ({ value: String(m.id), label: m.name }))]}
        value={draft.zone ? String(draft.zone) : ''}
        onPick={(v) => set({ zone: v ? Number(v) : null })}
        onClose={() => setPicker(null)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  group: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ages: { flexDirection: 'row', gap: 8 },
  age: { flex: 1, gap: 4 },
});
