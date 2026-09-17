import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, type AppColors } from './colors';

type ThemeContextValue = {
  colors: AppColors;
  scheme: 'light' | 'dark';
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
};

const THEME_OVERRIDE_KEY = 'metmap_theme_override';

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  scheme: 'light',
  isDarkMode: false,
  setDarkMode: () => {},
});

/**
 * Privzeto sledi sistemski nastavitvi (useColorScheme), a uporabnik jo lahko
 * ročno preglasi (Profil → Nastavitve → Temni način) – preglasitev se shrani
 * v AsyncStorage in ostane veljavna, dokler je znova ne spremeni.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_OVERRIDE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setOverride(stored);
    });
  }, []);

  const scheme: 'light' | 'dark' = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const setDarkMode = useCallback((value: boolean) => {
    const next = value ? 'dark' : 'light';
    setOverride(next);
    AsyncStorage.setItem(THEME_OVERRIDE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      isDarkMode: scheme === 'dark',
      setDarkMode,
    }),
    [scheme, setDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** `const { colors, scheme } = useTheme();` – uporabi namesto statičnega uvoza `colors`. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
