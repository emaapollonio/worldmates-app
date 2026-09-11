import React from 'react';
import { Alert } from 'react-native';
import ScreenPlaceholder, { PlaceholderButton } from '../components/ScreenPlaceholder';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const onLogout = () => {
    Alert.alert('Odjava', 'Se res želiš odjaviti?', [
      { text: 'Prekliči', style: 'cancel' },
      {
        text: 'Odjava',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('[Profile] odjava ni uspela:', error);
            Alert.alert('Napaka pri odjavi', error.message);
          }
          // Ob uspehu RootNavigator prek onAuthStateChange sam preklopi na AuthScreen.
        },
      },
    ]);
  };

  return (
    <ScreenPlaceholder
      title="Profil"
      subtitle="Uporabnikov račun, statistika (št. držav / celin) in nastavitve."
      icon="person-outline"
    >
      <PlaceholderButton label="Odjava" variant="outline" onPress={onLogout} />
    </ScreenPlaceholder>
  );
}
