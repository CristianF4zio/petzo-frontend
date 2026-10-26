import { Image } from 'expo-image';
import { ArrowLeft, ArrowRight, Camera, CircleAlert, ImagePlus, Star, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { color, font, radius, type } from '@/lib/theme';

export type Tile = { key: string; uri: string; path?: string; status: 'local' | 'up' | 'ok' | 'fail' };

type Props = {
  tiles: Tile[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (key: string) => void;
  onRetry: (key: string) => void;
  onAdd: () => void;
};

export function PhotoGrid({ tiles, selected, onSelect, onMove, onRemove, onRetry, onAdd }: Props) {
  const { width } = useWindowDimensions();
  const size = (width - 72 - 16) / 3; // 20pt screen gutter + 16pt card padding per side, two 8pt gaps
  const si = tiles.findIndex((t) => t.key === selected);

  if (!tiles.length) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Agregar fotos" onPress={onAdd} style={({ pressed }) => [styles.drop, pressed && { opacity: 0.7 }]}>
        <View style={styles.dropIcon}>
          <Camera size={28} color={color.brand} />
        </View>
        <Text style={type.title}>Agrega hasta 5 fotos</Text>
        <Text style={[type.small, { textAlign: 'center' }]}>Tomadas por ti. La primera será la portada.</Text>
      </Pressable>
    );
  }

  const actions =
    si < 0
      ? []
      : [
          si > 0 && { Icon: Star, text: 'Portada', label: 'Hacer portada', run: () => onMove(si, 0) },
          si > 0 && { Icon: ArrowLeft, text: '', label: 'Mover a la izquierda', run: () => onMove(si, si - 1) },
          si < tiles.length - 1 && { Icon: ArrowRight, text: '', label: 'Mover a la derecha', run: () => onMove(si, si + 1) },
        ].filter((a) => !!a);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.grid}>
        {tiles.map((t, i) => (
          <View key={t.key} style={[styles.tile, { width: size, height: size }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Foto ${i + 1}${i === 0 ? ', portada' : ''}`}
              accessibilityState={{ selected: selected === t.key }}
              onPress={() => onSelect(selected === t.key ? null : t.key)}
              style={StyleSheet.absoluteFill}
            >
              <Image source={t.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
            {selected === t.key ? <View style={styles.ring} pointerEvents="none" /> : null}
            {i === 0 && t.status !== 'fail' ? (
              <View style={styles.cover} pointerEvents="none">
                <Star size={12} color={color.brand} fill={color.brand} />
                <Text style={[type.badge, { color: color.ink }]}>Portada</Text>
              </View>
            ) : null}
            {t.status === 'up' ? (
              <View style={styles.overlay} pointerEvents="none">
                <ActivityIndicator color={color.canvas} />
                <Text style={[type.caption, { color: color.canvas, fontFamily: font.medium }]}>Subiendo…</Text>
              </View>
            ) : null}
            {t.status === 'fail' ? (
              <View style={[styles.overlay, styles.failed]}>
                <View style={styles.row}>
                  <CircleAlert size={14} color={color.error} />
                  <Text style={[type.caption, { color: color.error, fontFamily: font.medium }]}>No se subió</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Reintentar foto ${i + 1}`} onPress={() => onRetry(t.key)} style={styles.retry}>
                  <Text style={[type.label, { textDecorationLine: 'underline' }]}>Reintentar</Text>
                </Pressable>
              </View>
            ) : null}
            {t.status !== 'up' ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`Quitar foto ${i + 1}`} onPress={() => onRemove(t.key)} style={styles.removeHit}>
                {({ pressed }) => (
                  <View style={[styles.remove, pressed && { backgroundColor: color.inkPressed }]}>
                    <X size={16} color={color.canvas} strokeWidth={2.5} />
                  </View>
                )}
              </Pressable>
            ) : null}
          </View>
        ))}
        {tiles.length < 5 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Agregar fotos" onPress={onAdd} style={({ pressed }) => [styles.add, { width: size, height: size }, pressed && { opacity: 0.7 }]}>
            <ImagePlus size={24} color={color.brand} />
            <Text style={[type.caption, { color: color.ink, fontFamily: font.medium }]}>Agregar</Text>
          </Pressable>
        ) : null}
      </View>
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.run} style={({ pressed }) => [styles.action, pressed && { backgroundColor: color.sand }]}>
              <a.Icon size={18} color={color.ink} />
              {a.text ? <Text style={styles.actionText}>{a.text}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  drop: { height: 196, borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: color.hairline, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  dropIcon: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: color.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.sand },
  ring: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.md, borderWidth: 3, borderColor: color.ink },
  cover: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color.canvas, borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: 8 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.scrim, alignItems: 'center', justifyContent: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  failed: { backgroundColor: color.errorBg, justifyContent: 'flex-end', gap: 2, paddingHorizontal: 4 }, // stays clear of the remove button
  retry: { height: 44, justifyContent: 'center' },
  removeHit: { position: 'absolute', top: -4, right: -4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 26, height: 26, borderRadius: radius.full, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' },
  add: { borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: color.hairline, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { height: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: color.hairline, backgroundColor: color.canvas, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: font.medium, fontSize: 14, color: color.ink },
});
