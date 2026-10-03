import React, { useState } from 'react';
import { View, Pressable, StyleSheet, type TextInputProps } from 'react-native';
import { TextInput } from './AppText';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

/**
 * Polje za geslo z ikono očesa na desni, ki preklaplja med skritim in vidnim
 * geslom. `style` se uporabi na samem TextInput-u (dobi dodaten desni padding).
 */
export default function PasswordInput({ style, ...rest }: Omit<TextInputProps, 'secureTextEntry'>) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TextInput
        {...rest}
        style={[style, styles.inputPadding]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        style={styles.toggle}
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? STRINGS.auth.hidePassword : STRINGS.auth.showPassword}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputPadding: { paddingRight: 46 },
  toggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
