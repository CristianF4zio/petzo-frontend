import { Image } from 'expo-image';
import { Images, MapPin } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Pet } from '@/lib/api';
import { SEX, SIZE, ageText } from '@/lib/format';
import { color, font, radius, type } from '@/lib/theme';
import { VerifiedBadge } from './ui';

export const HEART = 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

export const isVerified = (pet: Pet) => pet.publisher.verified;
export const petMeta = (pet: Pet) => `${ageText(pet.ageMonths)} · ${SEX[pet.sex]} · ${SIZE[pet.size]}`;

type Props = { pet: Pet; zone: string; fav: boolean; onOpen: (id: string) => void; onFav: (id: string) => void };

export const PetCard = memo(function PetCard({ pet, zone, fav, onOpen, onFav }: Props) {
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver a ${pet.name}`} onPress={() => onOpen(pet.id)} style={styles.photo}>
        <Image source={pet.photos[0]?.url} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={pet.id} />
        <View style={styles.count} pointerEvents="none">
          <Images size={14} color={color.canvas} />
          <Text style={styles.countText}>{pet.photos.length}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fav ? `Quitar a ${pet.name} de favoritos` : `Guardar a ${pet.name} en favoritos`}
        onPress={() => onFav(pet.id)}
        style={styles.heart}
        hitSlop={4}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24">
          <Path d={HEART} fill={fav ? color.brand : 'rgba(0,0,0,0.5)'} stroke={color.canvas} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onOpen(pet.id)} style={styles.info}>
        <Text style={type.title} numberOfLines={1}>
          {pet.name}
        </Text>
        <Text style={type.small}>{petMeta(pet)}</Text>
        <View style={styles.row}>
          <MapPin size={14} color={color.muted} />
          <Text style={type.small}>{zone}</Text>
        </View>
        {isVerified(pet) ? (
          <View style={{ marginTop: 4 }}>
            <VerifiedBadge />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { gap: 12 },
  photo: { aspectRatio: 4 / 3, borderRadius: radius.md, overflow: 'hidden', backgroundColor: color.strong },
  heart: { position: 'absolute', top: 4, right: 4, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  count: { position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color.scrim, borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: 8 },
  countText: { fontFamily: font.medium, fontSize: 13, color: color.canvas },
  info: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
