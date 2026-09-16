import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type AppColors } from './colors';

type ThemeContextValue = {
  colors: AppColors;
  scheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue>({ colors: lightColors, scheme: 'light' });

/**
 * Zazna sistemsko nastavitev (useColorScheme) in po vsej app zamenja barvno
 * paleto glede na trenuten način – brez ponovnega zagona, ker se
 * useColorScheme() re-renderira ob vsaki spremembi sistemske teme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const scheme: 'light' | 'dark' = systemScheme === 'dark' ? 'dark' : 'light';

  const value = useMemo<ThemeContextValue>(
    () => ({ colors: scheme === 'dark' ? darkColors : lightColors, scheme }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** `const { colors, scheme } = useTheme();` – uporabi namesto statičnega uvoza `colors`. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
