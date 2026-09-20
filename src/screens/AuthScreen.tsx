import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { supabase } from '../lib/supabase';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { STRINGS } from '../constants/strings';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

/** Pot v custom URL scheme-u (glej "scheme" v app.json), kamor Supabase preusmeri po potrditvi e-pošte. */
const EMAIL_CONFIRM_PATH = 'confirm-email';

/**
 * Prijava / registracija. Ob uspehu ne navigiramo ročno – RootNavigator
 * posluša supabase.auth.onAuthStateChange in sam preklopi na glavno navigacijo.
 */
export default function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  const switchMode = (nextIsSignUp: boolean) => {
    setIsSignUp(nextIsSignUp);
    setConfirmPassword('');
  };

  // Uporabnik klikne potrditveno povezavo v e-pošti -> Supabase potrdi
  // naslov na svoji strani in preusmeri nazaj v app na EMAIL_CONFIRM_PATH
  // (glej emailRedirectTo v onSignUp spodaj). Tu samo prikažemo obvestilo -
  // uporabnik se nato prijavi ročno s svojim geslom (ni samodejne prijave).
  // Namenoma getInitialURL + addEventListener v try/catch in vgrajen baner
  // namesto Alert.alert: ob hladnem zagonu prek povezave nativni Activity
  // morda še ni povsem pripravljen, zato iz effecta ne kličemo nativnih dialogov.
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (url?.includes(EMAIL_CONFIRM_PATH)) {
        setIsSignUp(false);
        setConfirmPassword('');
        setEmailConfirmed(true);
      }
    };
    Linking.getInitialURL()
      .then(handleUrl)
      .catch((e) => console.warn('[Auth] getInitialURL ni uspel:', e));
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const validate = () => {
    if (!email.trim() || !password) {
      Alert.alert(STRINGS.auth.missingFieldsTitle, STRINGS.auth.missingFieldsMessage);
      return false;
    }
    if (isSignUp && password !== confirmPassword) {
      Alert.alert(STRINGS.auth.passwordMismatchTitle, STRINGS.auth.passwordMismatchMessage);
      return false;
    }
    return true;
  };

  const onSignIn = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (e) {
      console.error('[Auth] prijava ni uspela:', e);
      Alert.alert(STRINGS.auth.signInFailedTitle, e instanceof Error ? e.message : STRINGS.common.genericRetryMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: Linking.createURL(EMAIL_CONFIRM_PATH) },
      });
      if (error) throw error;
      if (!data.session) {
        Alert.alert(STRINGS.auth.confirmEmailTitle, STRINGS.auth.confirmEmailMessage);
      }
    } catch (e) {
      console.error('[Auth] registracija ni uspela:', e);
      Alert.alert(STRINGS.auth.signUpFailedTitle, e instanceof Error ? e.message : STRINGS.common.genericRetryMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Ionicons name="earth" size={40} color={colors.primary} />
        </View>
        {emailConfirmed ? (
          <View style={styles.confirmedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
            <View style={styles.confirmedBannerText}>
              <Text style={styles.confirmedTitle}>{STRINGS.auth.emailConfirmedTitle}</Text>
              <Text style={styles.confirmedMessage}>{STRINGS.auth.emailConfirmedMessage}</Text>
            </View>
          </View>
        ) : null}
        <Text style={styles.title}>{isSignUp ? STRINGS.auth.createAccountTitle : STRINGS.auth.appName}</Text>
        <Text style={styles.subtitle}>{isSignUp ? STRINGS.auth.createAccountSubtitle : STRINGS.auth.subtitle}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{STRINGS.auth.emailLabel}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={STRINGS.auth.emailPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{STRINGS.auth.passwordLabel}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={STRINGS.auth.passwordPlaceholder}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {isSignUp ? (
          <View style={styles.field}>
            <Text style={styles.label}>{STRINGS.auth.confirmPasswordLabel}</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={STRINGS.auth.passwordPlaceholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed, loading && styles.btnDisabled]}
          onPress={isSignUp ? onSignUp : onSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryBtnText}>{isSignUp ? STRINGS.auth.signUpButton : STRINGS.auth.signInButton}</Text>
          )}
        </Pressable>

        <Pressable style={styles.switchModeLink} onPress={() => switchMode(!isSignUp)} disabled={loading}>
          <Text style={styles.switchModeLinkText}>
            {isSignUp ? STRINGS.auth.switchToLoginPrompt : STRINGS.auth.switchToSignUpPrompt}
          </Text>
        </Pressable>

        {!isSignUp ? (
          <Pressable style={styles.forgotPasswordLink} onPress={() => setForgotPasswordVisible(true)} disabled={loading}>
            <Text style={styles.forgotPasswordLinkText}>{STRINGS.auth.forgotPasswordLink}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        initialEmail={email}
        onClose={() => setForgotPasswordVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },

  logoWrap: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { textAlign: 'center', fontFamily: FONT_SERIF_BOLD, fontSize: 26, color: colors.textPrimary },
  subtitle: { textAlign: 'center', fontSize: 14, color: colors.textSecondary, marginBottom: 20 },

  field: { marginBottom: 4 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: colors.textPrimary,
  },

  primaryBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: { backgroundColor: colors.primaryDark },
  primaryBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },

  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
  },
  confirmedBannerText: { flex: 1 },
  confirmedTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  confirmedMessage: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },

  switchModeLink: { marginTop: 16, alignItems: 'center' },
  switchModeLinkText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  forgotPasswordLink: { marginTop: 12, alignItems: 'center' },
  forgotPasswordLinkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  btnDisabled: { opacity: 0.7 },
});
