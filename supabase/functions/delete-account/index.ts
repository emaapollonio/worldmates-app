// Edge Function: izbris uporabnikovega računa in VSEH njegovih podatkov.
//
// Auth račun je iz odjemalca nemogoče izbrisati (potrebuje service_role), zato to
// naredi ta funkcija. Kliče se iz app-a: supabase.functions.invoke('delete-account').
// Uporabnika prepozna iz JWT-ja v Authorization headerju – nikoli iz telesa
// zahtevka, zato lahko vsak izbriše samo sebe.
//
// Deploy:  supabase functions deploy delete-account
// (SUPABASE_URL, SUPABASE_ANON_KEY in SUPABASE_SERVICE_ROLE_KEY Supabase doda sam.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PERSON_PHOTOS_BUCKET = 'person-photos';
const AVATAR_BUCKET = 'avatars';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Iz javnega URL-ja (…/object/public/<bucket>/<pot>) izlušči pot datoteke v bucketu. */
function storagePathFromUrl(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(401, { error: 'Missing Authorization header' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json(401, { error: 'Invalid session' });
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1) Fotografije v Storage – najprej; če to spodleti, se še nič ne izbriše in uporabnik lahko poskusi znova.
    const { data: people, error: peopleError } = await admin
      .from('people')
      .select('photo_url, photo_urls')
      .eq('user_id', userId);
    if (peopleError) throw peopleError;

    const photoPaths = new Set<string>();
    for (const row of people ?? []) {
      const urls: string[] = [...(row.photo_urls ?? []), ...(row.photo_url ? [row.photo_url] : [])];
      for (const url of urls) {
        const path = storagePathFromUrl(url, PERSON_PHOTOS_BUCKET);
        if (path) photoPaths.add(path);
      }
    }
    const photoList = [...photoPaths];
    for (let i = 0; i < photoList.length; i += 100) {
      const { error } = await admin.storage.from(PERSON_PHOTOS_BUCKET).remove(photoList.slice(i, i + 100));
      if (error) throw error;
    }

    // Avatarji so v mapi "<uid>/…".
    const { data: avatarFiles, error: listError } = await admin.storage.from(AVATAR_BUCKET).list(userId, { limit: 1000 });
    if (listError) throw listError;
    if (avatarFiles && avatarFiles.length > 0) {
      const { error } = await admin.storage.from(AVATAR_BUCKET).remove(avatarFiles.map((f) => `${userId}/${f.name}`));
      if (error) throw error;
    }

    // 2) Zapisi v bazi (person_contacts se izbrišejo prek on delete cascade).
    const { error: delPeopleError } = await admin.from('people').delete().eq('user_id', userId);
    if (delPeopleError) throw delPeopleError;

    // Tabela connections morda še ne obstaja (odvisno od migracij) – napaka tu ni usodna.
    const { error: delConnError } = await admin
      .from('connections')
      .delete()
      .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);
    if (delConnError) console.warn('connections cleanup skipped:', delConnError.message);

    const { error: delProfileError } = await admin.from('profiles').delete().eq('id', userId);
    if (delProfileError) throw delProfileError;

    // 3) Nazadnje še sam auth račun.
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return json(200, { deleted: true });
  } catch (e) {
    console.error('delete-account failed:', e);
    return json(500, { error: e instanceof Error ? e.message : 'Unknown error' });
  }
});
