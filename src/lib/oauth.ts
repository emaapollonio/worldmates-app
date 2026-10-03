import * as Linking from 'expo-linking';

import { supabase } from './supabase';

/** Pot v custom URL scheme-u (glej "scheme" v app.json), kamor Supabase preusmeri po Google prijavi. */
export const OAUTH_CALLBACK_PATH = 'auth-callback';

/** Koliko časa po zagonu prijave še sprejmemo povratni link (uporabnik se v brskalniku lahko zadrži). */
const PENDING_MAX_AGE_MS = 10 * 60 * 1000;
let pendingSince: number | null = null;

/**
 * Začne prijavo z Googlom: Supabase vrne URL strani za prijavo, ki jo odpremo v
 * zunanjem brskalniku (Linking – brez dodatnega nativnega modula). Po prijavi
 * Supabase preusmeri na metmap://auth-callback#access_token=…, kar ujame
 * RootNavigator (completeOAuthFromUrl) in z njim vzpostavi sejo.
 */
export async function startGoogleSignIn(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: Linking.createURL(OAUTH_CALLBACK_PATH),
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Supabase ni vrnil URL-ja za prijavo z Googlom.');
  pendingSince = Date.now();
  await Linking.openURL(data.url);
}

/** Parametri iz fragmenta (#a=b) in poizvedbe (?a=b) – Supabase (implicit flow) vrne žetone v fragmentu. */
function readParams(url: string): URLSearchParams {
  const params = new URLSearchParams();
  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = beforeHash.indexOf('?');
  if (queryIndex !== -1) new URLSearchParams(beforeHash.slice(queryIndex + 1)).forEach((v, k) => params.set(k, v));
  if (hashIndex !== -1) new URLSearchParams(url.slice(hashIndex + 1)).forEach((v, k) => params.set(k, v));
  return params;
}

/**
 * Če je `url` povratni link prijave z Googlom, vzpostavi sejo (onAuthStateChange v
 * RootNavigator nato sam preklopi na glavno navigacijo, ensureProfile ustvari profil).
 * Vrne true, če je bil link naš; ob napaki prijave vrže Error.
 * Povratni link sprejmemo samo, če smo prijavo pred kratkim sami začeli – drugače bi
 * lahko katerakoli aplikacija s tem linkom prijavila uporabnika v tuj račun.
 */
export async function completeOAuthFromUrl(url: string | null): Promise<boolean> {
  if (!url || !url.includes(OAUTH_CALLBACK_PATH)) return false;

  if (pendingSince === null || Date.now() - pendingSince > PENDING_MAX_AGE_MS) {
    console.warn('[OAuth] povratni link brez začete prijave – prezrt.');
    return true;
  }

  const params = readParams(url);
  const errorDescription = params.get('error_description') ?? params.get('error');
  if (errorDescription) {
    pendingSince = null;
    throw new Error(errorDescription);
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return true;

  pendingSince = null;
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw error;
  return true;
}
