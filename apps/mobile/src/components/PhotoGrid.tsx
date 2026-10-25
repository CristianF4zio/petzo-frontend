import { Image } from 'expo-image';
import { ArrowLeft, ArrowRight, CircleAlert, ImagePlus, Star, Trash2 } from 'lucide-react-native';
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
  const size = (width - 32 - 16) / 3;
  const si = tiles.findIndex((t) => t.key === selected);

  const actions =
    si < 0
      ? []
      : [
          si > 0 && { Icon: Star, text: 'Portada', label: 'Hacer portada', run: () => onMove(si, 0) },
          si > 0 && { Icon: ArrowLeft, text: '', label: 'Mover a la izquierda', run: () => onMove(si, si - 1) },
          si < tiles.length - 1 && { Icon: ArrowRight, text: '', label: 'Mover a la derecha', run: () => onMove(si, si + 1) },
          { Icon: Trash2, text: 'Quitar', label: 'Quitar foto', run: () => onRemove(tiles[si]!.key) },
        ].filter((a) => !!a);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.grid}>
        {tiles.map((t, i) => (
          <View key={t.key} style={[styles.tile, { width: size, height: size }, selected === t.key && styles.selected]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Foto ${i + 1}${i === 0 ? ', portada' : ''}`} onPress={() => onSelect(selected === t.key ? null : t.key)} style={StyleSheet.absoluteFill}>
              <Image source={t.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
            {i === 0 && t.status !== 'fail' ? <Text style={styles.cover}>Portada</Text> : null}
            {t.status === 'up' ? (
              <View style={styles.uploading} pointerEvents="none">
                <ActivityIndicator color={color.canvas} />
                <Text style={[type.badge, { color: color.canvas, fontSize: 13 }]}>Subiendo…</Text>
              </View>
            ) : null}
            {t.status === 'fail' ? (
              <View style={styles.failed}>
                <View style={styles.row}>
                  <CircleAlert size={14} color={color.error} />
                  <Text style={[type.caption, { color: color.error, fontFamily: font.medium }]}>No se subió</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => onRetry(t.key)} style={{ height: 40, justifyContent: 'center' }}>
                  <Text style={[type.label, { textDecorationLine: 'underline' }]}>Reintentar</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
        {tiles.length < 5 ? (
          <Pressable accessibilityRole="button" onPress={onAdd} style={[styles.add, { width: size, height: size }]}>
            <ImagePlus size={24} color={color.ink} />
            <Text style={[type.caption, { color: color.ink, fontFamily: font.medium }]}>Agregar</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={type.caption}>{`${tiles.length}/5 fotos`}</Text>
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.run} style={styles.action}>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.strong },
  selected: { borderWidth: 2, borderColor: color.ink },
  cover: { position: 'absolute', top: 8, left: 8, backgroundColor: color.canvas, borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: 8, overflow: 'hidden', fontFamily: font.semibold, fontSize: 11, color: color.ink },
  uploading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.scrim, alignItems: 'center', justifyContent: 'center', gap: 8 },
  failed: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.errorBg, alignItems: 'center', justifyContent: 'center', padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  add: { borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: color.muted, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { height: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: color.hairline, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: font.medium, fontSize: 14, color: color.ink },
});
