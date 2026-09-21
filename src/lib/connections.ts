import { supabase } from './supabase';

export type PendingRequest = {
  connection_id: string;
  requester_id: string;
  display_name: string | null;
  created_at: string;
};

export type ConnectionLocation = {
  current_location: string;
  current_location_updated_at: string | null;
};

/** Pošlje 'pending' zahtevo za povezavo. Vrne 'exists', če povezava/zahteva med njima že obstaja. */
export async function requestConnection(targetUserId: string): Promise<'sent' | 'exists'> {
  const { data } = await supabase.auth.getSession();
  const me = data.session?.user.id;
  if (!me || me === targetUserId) throw new Error('Invalid connection target');

  const { error } = await supabase
    .from('connections')
    .insert({ user_id_a: me, user_id_b: targetUserId, status: 'pending' });
  if (error) {
    if (error.code === '23505') return 'exists';
    throw error;
  }
  return 'sent';
}

export async function listPendingRequests(): Promise<PendingRequest[]> {
  const { data, error } = await supabase.rpc('get_pending_connection_requests');
  if (error) throw error;
  return (data ?? []) as PendingRequest[];
}

export async function acceptConnection(connectionId: string): Promise<void> {
  const { error } = await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId);
  if (error) throw error;
}

export async function declineConnection(connectionId: string): Promise<void> {
  const { error } = await supabase.from('connections').delete().eq('id', connectionId);
  if (error) throw error;
}

/** Trenutna lokacija povezanega uporabnika, ali null (ni sprejete povezave / ne deli / ni podatka). */
export async function getConnectionLocation(targetUserId: string): Promise<ConnectionLocation | null> {
  const { data, error } = await supabase.rpc('get_connection_location', { target: targetUserId });
  if (error) throw error;
  const row = (data as ConnectionLocation[] | null)?.[0];
  return row ?? null;
}
