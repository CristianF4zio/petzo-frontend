import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type LocalPhoto = { uri: string; base64: string };

// RNF-06: max side 1080 px, JPEG 0.7 keeps a phone photo around 150–400 KB
async function compress(uri: string): Promise<LocalPhoto> {
  const image = await ImageManipulator.manipulate(uri).resize({ width: 1080 }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return { uri: saved.uri, base64: saved.base64! };
}

export async function pickPhotos(limit: number): Promise<LocalPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1,
  });
  if (result.canceled) return [];
  return Promise.all(result.assets.slice(0, limit).map((a) => compress(a.uri)));
}

export async function pickAvatar(): Promise<LocalPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (result.canceled) return null;
  const image = await ImageManipulator.manipulate(result.assets[0]!.uri).resize({ width: 512 }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return { uri: saved.uri, base64: saved.base64! };
}
