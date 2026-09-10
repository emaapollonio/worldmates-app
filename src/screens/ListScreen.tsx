import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenPlaceholder, { PlaceholderButton } from '../components/ScreenPlaceholder';
import type { RootStackParamList } from '../navigation/types';

export default function ListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScreenPlaceholder
      title="Prijatelji"
      subtitle="Seznam vseh oseb – enak nabor kot na zemljevidu, z razvrščanjem in iskanjem."
      icon="people-outline"
    >
      <PlaceholderButton
        label="Odpri profil osebe (demo)"
        onPress={() => navigation.navigate('PersonProfile', { personId: 'demo' })}
      />
    </ScreenPlaceholder>
  );
}
