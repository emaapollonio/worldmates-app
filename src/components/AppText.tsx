import React, { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, type TextProps, type TextInputProps } from 'react-native';

import { useFontPreference } from '../theme/FontContext';
import { withAccessibleFont } from '../theme/typography';

/**
 * Text / TextInput, ki ob vklopljeni "lažje berljivi pisavi" (Profil → Nastavitve)
 * zamenjata pisavo v celotni aplikaciji. Namesto uvoza iz 'react-native' uporabi
 * `import { Text, TextInput } from '…/components/AppText'`.
 */
export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...rest }, ref) {
  const { accessibleFont } = useFontPreference();
  return <RNText ref={ref} {...rest} style={accessibleFont ? withAccessibleFont(style) : style} />;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...rest }, ref) {
  const { accessibleFont } = useFontPreference();
  return <RNTextInput ref={ref} {...rest} style={accessibleFont ? withAccessibleFont(style) : style} />;
});
