import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { largeSecureStore } from './secureStorage';

/**
 * Supabase klient za MetMap.
 * URL in anon ključ prideta iz .env (EXPO_PUBLIC_* → Expo ju vgradi ob buildu).
 * Seja (prijava) se shrani prek largeSecureStore (AES-šifrirana v AsyncStorage,
 * šifrirni ključ v SecureStore/Keychain) namesto navadnega AsyncStorage, da
 * uporabnika ob ponovnem zagonu ni treba znova prijavljati.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Manjkata EXPO_PUBLIC_SUPABASE_URL in/ali EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Ustvari .env po vzoru .env.example in znova zaženi `npx expo start -c`.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: largeSecureStore,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
