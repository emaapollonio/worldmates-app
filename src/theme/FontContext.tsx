import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FontContextValue = {
  /** Vklopljena "lažje berljiva" pisava (Atkinson Hyperlegible) v celotni aplikaciji. */
  accessibleFont: boolean;
  setAccessibleFont: (value: boolean) => void;
};

const ACCESSIBLE_FONT_KEY = 'metmap_accessible_font';

const FontContext = createContext<FontContextValue>({
  accessibleFont: false,
  setAccessibleFont: () => {},
});

/**
 * Hrani izbiro pisave (privzeto izklopljeno = obstoječa pisava) in jo
 * obdrži v AsyncStorage. Dokler shranjena vrednost ni prebrana, ne izrisuje
 * ničesar, da ob zagonu ne utripne napačna pisava (splash se skrije šele po tem).
 */
export function FontProvider({ children }: { children: React.ReactNode }) {
  const [accessibleFont, setAccessibleFontState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ACCESSIBLE_FONT_KEY)
      .then((stored) => {
        if (stored === '1') setAccessibleFontState(true);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setAccessibleFont = useCallback((value: boolean) => {
    setAccessibleFontState(value);
    AsyncStorage.setItem(ACCESSIBLE_FONT_KEY, value ? '1' : '0').catch(() => {});
  }, []);

  const value = useMemo(() => ({ accessibleFont, setAccessibleFont }), [accessibleFont, setAccessibleFont]);

  if (!loaded) return null;
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export function useFontPreference(): FontContextValue {
  return useContext(FontContext);
}
