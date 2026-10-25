import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type LocalPhoto = { uri: string };

// RNF-06: longer side capped at `max` px (never upscaled), JPEG 0.7 keeps a phone photo around 150–400 KB
async function compress(a: ImagePicker.ImagePickerAsset, max: number): Promise<LocalPhoto> {
  const ctx = ImageManipulator.manipulate(a.uri);
  const long = Math.max(a.width, a.height);
  // unknown size (0) falls back to capping the width
  const image = await (!long || long > max ? ctx.resize(a.width >= a.height ? { width: max } : { height: max }) : ctx).renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return { uri: saved.uri };
}

export async function pickPhotos(limit: number): Promise<LocalPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1,
  });
  if (result.canceled) return [];
  // One at a time: decoding several full-size photos at once can run a low-end phone out of memory
  const photos: LocalPhoto[] = [];
  for (const a of result.assets.slice(0, limit)) photos.push(await compress(a, 1080));
  return photos;
}

export async function pickAvatar(): Promise<LocalPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (result.canceled) return null;
  return compress(result.assets[0]!, 512);
}
