import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenPlaceholder, { PlaceholderButton } from '../components/ScreenPlaceholder';
import type { RootStackParamList } from '../navigation/types';

export default function AddPersonScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScreenPlaceholder
      title="Dodaj prijatelja"
      subtitle="Hiter obrazec: ime, fotografija, kraj bivanja, kontakt, beležka."
      icon="person-add-outline"
    >
      <PlaceholderButton label="Prekliči" variant="outline" onPress={() => navigation.goBack()} />
    </ScreenPlaceholder>
  );
}
