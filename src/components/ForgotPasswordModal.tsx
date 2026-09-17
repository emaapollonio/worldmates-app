import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import { supabase } from '../lib/supabase';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

type Props = {
  visible: boolean;
  initialEmail: string;
  onClose: () => void;
};

/** Modal za "Pozabljeno geslo?" – pošlje Supabase-ov reset e-mail, ostalo uredi Supabase samo. */
export default function ForgotPasswordModal({ visible, initialEmail, onClose }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);

  // Ob vsakem odprtju modala predizpolni z e-pošto, ki jo je uporabnik že vpisal na AuthScreen.
  useEffect(() => {
    if (visible) setEmail(initialEmail);
  }, [visible, initialEmail]);

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (error) throw error;
      onClose();
      Alert.alert(STRINGS.auth.resetPasswordSentTitle, STRINGS.auth.resetPasswordSentMessage);
    } catch (e) {
      console.error('[Auth] ponastavitev gesla ni uspela:', e);
      Alert.alert(
        STRINGS.auth.resetPasswordFailedTitle,
        e instanceof Error ? e.message : STRINGS.common.genericRetryMessage,
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>{STRINGS.auth.resetPasswordTitle}</Text>
          <Text style={styles.description}>{STRINGS.auth.resetPasswordDescription}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={STRINGS.auth.emailPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={onClose} disabled={sending}>
              <Text style={styles.btnText}>{STRINGS.common.cancel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
              onPress={onSubmit}
              disabled={sending || !email.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.btnPrimaryText}>{STRINGS.auth.resetPasswordSendButton}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      gap: 12,
    },
    title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    description: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: -6 },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      fontSize: 15,
      color: colors.textPrimary,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
    btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
    btnPressed: { opacity: 0.7 },
    btnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    btnPrimary: { backgroundColor: colors.primary },
    btnPrimaryPressed: { backgroundColor: colors.primaryDark },
    btnPrimaryText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },
  });
