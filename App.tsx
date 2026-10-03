import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_400Regular_Italic,
  AtkinsonHyperlegible_700Bold,
  AtkinsonHyperlegible_700Bold_Italic,
} from '@expo-google-fonts/atkinson-hyperlegible';

import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { FontProvider, useFontPreference } from './src/theme/FontContext';
import { FONT_ACCESSIBLE_BOLD, FONT_ACCESSIBLE_REGULAR } from './src/theme/typography';
import { navigationRef } from './src/navigation/navigationRef';
import CrashFallback from './src/components/CrashFallback';

SplashScreen.preventAutoHideAsync().catch(() => {});

// DSN pride iz .env / EAS env (EXPO_PUBLIC_SENTRY_DSN), nikoli iz kode. Brez DSN
// (npr. lokalni razvoj) Sentry ostane izklopljen.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN && !__DEV__,
});

const NAV_FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
  heavy: { fontFamily: 'System', fontWeight: '900' as const },
};

// Naslovi navigacije (glava, zavihki) pri vklopljeni lažje berljivi pisavi; ta ima samo navadno in krepko različico.
const NAV_FONTS_ACCESSIBLE = {
  regular: { fontFamily: FONT_ACCESSIBLE_REGULAR, fontWeight: 'normal' as const },
  medium: { fontFamily: FONT_ACCESSIBLE_REGULAR, fontWeight: 'normal' as const },
  bold: { fontFamily: FONT_ACCESSIBLE_BOLD, fontWeight: 'normal' as const },
  heavy: { fontFamily: FONT_ACCESSIBLE_BOLD, fontWeight: 'normal' as const },
};

function AppContent() {
  const { colors, scheme } = useTheme();
  const { accessibleFont } = useFontPreference();

  // Splash skrijemo šele, ko je prebrana tudi shranjena izbira pisave (FontProvider do takrat ne izrisuje).
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const navTheme = useMemo<NavigationTheme>(
    () => ({
      dark: scheme === 'dark',
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.primary,
      },
      fonts: accessibleFont ? NAV_FONTS_ACCESSIBLE : NAV_FONTS,
    }),
    [colors, scheme, accessibleFont],
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
      {/* Na dnu drevesa, da se sporočila izrišejo nad vso vsebino (tudi modale). */}
      <Toast />
    </SafeAreaProvider>
  );
}

function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_400Regular_Italic,
    AtkinsonHyperlegible_700Bold,
    AtkinsonHyperlegible_700Bold_Italic,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Sentry.ErrorBoundary fallback={() => <CrashFallback />}>
      <ThemeProvider>
        <FontProvider>
          <AppContent />
        </FontProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(App);
