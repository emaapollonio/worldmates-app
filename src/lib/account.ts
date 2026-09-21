import { supabase } from './supabase';
import { setCachedPeople } from './offlineCache';

/**
 * Trajno izbriše račun in vse podatke prek Edge Function "delete-account"
 * (potrebuje service_role, zato ni mogoče iz odjemalca), nato lokalno odjavi.
 * Odjava je "local", ker je JWT po izbrisu računa na strežniku že neveljaven.
 */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;

  await setCachedPeople([]);
  await supabase.auth.signOut({ scope: 'local' });
}
