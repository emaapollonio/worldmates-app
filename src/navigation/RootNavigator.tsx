import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';
import { colors } from '../theme/colors';
import TabNavigator from './TabNavigator';
import AddPersonScreen from '../screens/AddPersonScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddPerson"
        component={AddPersonScreen}
        options={({ route }) => ({
          title: route.params?.personId ? 'Uredi osebo' : 'Dodaj prijatelja',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="PersonProfile"
        component={PersonProfileScreen}
        options={{ title: 'Podrobnosti prijatelja' }}
      />
    </Stack.Navigator>
  );
}
