import { supabase } from './supabase';

/** Ime bucketa v Supabase Storage za fotografije oseb. */
export const PERSON_PHOTOS_BUCKET = 'person-photos';

function guessExt(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}

function contentTypeForExt(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

/** Naloži eno lokalno sliko (file:// uri iz expo-image-picker) v Supabase Storage in vrne javni URL. */
export async function uploadPersonPhoto(localUri: string): Promise<string> {
  const ext = guessExt(localUri);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(PERSON_PHOTOS_BUCKET)
    .upload(path, arrayBuffer, { contentType: contentTypeForExt(ext), upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(PERSON_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Naloži več slik (vzporedno) in vrne javne URL-je v istem vrstnem redu. */
export async function uploadPersonPhotos(localUris: string[]): Promise<string[]> {
  return Promise.all(localUris.map(uploadPersonPhoto));
}
