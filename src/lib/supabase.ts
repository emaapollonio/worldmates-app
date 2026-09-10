import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase klient za WorldMate.
 *
 * URL in anon ključ prideta iz .env (EXPO_PUBLIC_* → Expo ju vgradi ob buildu).
 * Auth (prijava + shranjevanje seje) dodamo v naslednjem koraku; takrat sem
 * pride še varen storage adapter in `persistSession: true`.
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
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
