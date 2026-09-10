import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import ScreenPlaceholder, { PlaceholderButton } from '../components/ScreenPlaceholder';
import type { RootStackParamList } from '../navigation/types';

export default function PersonProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PersonProfile'>>();
  const personId = route.params?.personId ?? '—';

  return (
    <ScreenPlaceholder
      title="Podrobnosti prijatelja"
      subtitle={`Vsi podatki osebe, gumb "Piši" in urejanje/brisanje.\npersonId: ${personId}`}
      icon="id-card-outline"
    >
      <PlaceholderButton label="Nazaj" variant="outline" onPress={() => navigation.goBack()} />
    </ScreenPlaceholder>
  );
}
