import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

/** Ime bucketa v Supabase Storage za fotografije oseb. */
export const PERSON_PHOTOS_BUCKET = 'person-photos';

/** Ime bucketa v Supabase Storage za profilne slike uporabnikov. */
export const AVATAR_BUCKET = 'avatars';

const MAX_UPLOAD_WIDTH = 1200;
const UPLOAD_JPEG_QUALITY = 0.7;

function getImageWidth(uri: string): Promise<number> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width) => resolve(width), reject);
  });
}

/**
 * Pred nalaganjem stisne sliko: zmanjša na max 1200px širine (razmerje
 * ostane, manjših slik ne povečuje) in jo shrani kot JPEG s kakovostjo 70 %.
 * Ker gre za fotografije, je izguba prosojnosti (PNG) sprejemljiva.
 * V razvojnem načinu izpiše velikost pred/po.
 */
async function compressForUpload(localUri: string): Promise<ArrayBuffer> {
  const width = await getImageWidth(localUri);
  const result = await ImageManipulator.manipulateAsync(
    localUri,
    width > MAX_UPLOAD_WIDTH ? [{ resize: { width: MAX_UPLOAD_WIDTH } }] : [],
    { compress: UPLOAD_JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const compressed = await (await fetch(result.uri)).arrayBuffer();

  if (__DEV__) {
    const originalBytes = (await (await fetch(localUri)).arrayBuffer()).byteLength;
    const pct = Math.round((1 - compressed.byteLength / originalBytes) * 100);
    console.log(
      `[storage] stiskanje slike: ${width}px, ${(originalBytes / 1024).toFixed(0)} KB -> ` +
        `${result.width}px, ${(compressed.byteLength / 1024).toFixed(0)} KB (-${pct} %)`,
    );
  }

  return compressed;
}

async function uploadCompressed(bucket: string, path: string, localUri: string): Promise<string> {
  const body = await compressForUpload(localUri);

  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Stisne in naloži eno lokalno sliko (file:// uri iz expo-image-picker) v Supabase Storage in vrne javni URL. */
export async function uploadPersonPhoto(localUri: string): Promise<string> {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  return uploadCompressed(PERSON_PHOTOS_BUCKET, path, localUri);
}

/** Naloži več slik (vzporedno) in vrne javne URL-je v istem vrstnem redu. */
export async function uploadPersonPhotos(localUris: string[]): Promise<string[]> {
  return Promise.all(localUris.map(uploadPersonPhoto));
}

/**
 * Stisne in naloži profilno sliko v mapo "<uid>/..." (storage politike v
 * profiles migraciji preverijo lastništvo prek te mape) in vrne javni URL.
 */
export async function uploadAvatar(localUri: string, userId: string): Promise<string> {
  const path = `${userId}/${Date.now()}.jpg`;
  return uploadCompressed(AVATAR_BUCKET, path, localUri);
}
