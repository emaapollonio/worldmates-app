import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenPlaceholder, { PlaceholderButton } from '../components/ScreenPlaceholder';
import type { RootStackParamList } from '../navigation/types';

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScreenPlaceholder
      title="Zemljevid sveta"
      subtitle="Domači zaslon – tu bo interaktivni svetovni zemljevid s pini oseb in iskalnikom."
      icon="map-outline"
    >
      <PlaceholderButton
        label="Odpri profil osebe (demo)"
        onPress={() => navigation.navigate('PersonProfile', { personId: 'demo' })}
      />
      <PlaceholderButton
        label="Dodaj osebo"
        variant="outline"
        onPress={() => navigation.navigate('AddPerson')}
      />
    </ScreenPlaceholder>
  );
}
