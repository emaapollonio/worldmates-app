import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';

import type { RootStackParamList } from './types';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { supabase } from '../lib/supabase';
import { ensureProfile } from '../lib/profiles';
import { STRINGS } from '../constants/strings';
import TabNavigator from './TabNavigator';
import AuthScreen from '../screens/AuthScreen';
import AddPersonScreen from '../screens/AddPersonScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    // Preklopi med prijavljenim/neprijavljenim stanjem ob vsaki spremembi seje
    // (prijava, registracija, odjava, potek/osvežitev žetona).
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Poskrbi, da ima vsak prijavljen uporabnik vrstico v `profiles` (ustvari
  // jo ob prvi prijavi, sicer je no-op – glej ensureProfile).
  useEffect(() => {
    if (!session?.user.id) return;
    ensureProfile(session.user.id).catch((e) => console.error('[RootNavigator] ensureProfile ni uspel:', e));
  }, [session?.user.id]);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: FONT_SERIF_BOLD },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {session ? (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddPerson"
            component={AddPersonScreen}
            options={({ route }) => ({
              title: route.params?.personId ? STRINGS.navigation.editPersonTitle : STRINGS.navigation.addPersonTitle,
              presentation: 'modal',
            })}
          />
          <Stack.Screen
            name="PersonProfile"
            component={PersonProfileScreen}
            options={{ title: STRINGS.navigation.personProfileTitle }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  });
