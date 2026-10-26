import { Image } from 'expo-image';
import { BadgeCheck, Images, MapPin } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Pet } from '@/lib/api';
import { SEX, SIZE, ageText } from '@/lib/format';
import { color, font, radius, shadow, type } from '@/lib/theme';

export const HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

export const petMeta = (pet: Pet) => `${ageText(pet.ageMonths)} · ${SEX[pet.sex]} · ${SIZE[pet.size]}`;

export function HeartIcon({ on, size = 20, tint = color.brand }: { on: boolean; size?: number; tint?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={HEART} fill={on ? tint : 'none'} stroke={on ? tint : color.ink} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

type Props = { pet: Pet; zone: string; fav: boolean; onOpen: (id: string) => void; onFav: (id: string) => void };

export const PetCard = memo(function PetCard({ pet, zone, fav, onOpen, onFav }: Props) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver a ${pet.name}, ${petMeta(pet)}, ${zone}${pet.publisher.verified ? ', fundación verificada' : ''}`}
        onPress={() => onOpen(pet.id)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.photo}>
          <Image source={pet.photos[0]?.url} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={pet.id} />
          {pet.photos.length > 1 ? (
            <View style={styles.count}>
              <Images size={12} color={color.canvas} />
              <Text style={styles.countText}>{pet.photos.length}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.info}>
          <View style={styles.row}>
            <Text style={[type.title, styles.name]} numberOfLines={1}>
              {pet.name}
            </Text>
            {pet.publisher.verified ? <BadgeCheck size={16} color={color.success} /> : null}
          </View>
          <View style={styles.row}>
            <MapPin size={14} color={color.muted} />
            <Text style={[type.caption, { flex: 1 }]} numberOfLines={1}>
              {zone}
            </Text>
          </View>
          <Text style={[type.caption, { color: color.body }]} numberOfLines={1}>{`${ageText(pet.ageMonths)} · ${SIZE[pet.size]}`}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fav ? `Quitar a ${pet.name} de favoritos` : `Guardar a ${pet.name} en favoritos`}
        accessibilityState={{ selected: fav }}
        onPress={() => onFav(pet.id)}
        style={styles.heartHit}
      >
        {({ pressed }) => (
          <View style={[styles.heart, fav && { backgroundColor: color.brand }, pressed && styles.pressed]}>
            <HeartIcon on={fav} size={18} tint={color.canvas} />
          </View>
        )}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: color.canvas, borderRadius: radius.md, ...shadow },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  photo: { aspectRatio: 1, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, overflow: 'hidden', backgroundColor: color.sand },
  heartHit: { position: 'absolute', top: 2, right: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  heart: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.12, elevation: 3 },
  count: { position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color.scrim, borderRadius: radius.full, paddingVertical: 3, paddingHorizontal: 8 },
  countText: { fontFamily: font.medium, fontSize: 12, color: color.canvas },
  info: { gap: 3, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1, fontFamily: font.bold },
});
