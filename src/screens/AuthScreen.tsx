import React, { useState } from 'react';
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

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

/**
 * Prijava / registracija. Ob uspehu ne navigiramo ročno – RootNavigator
 * posluša supabase.auth.onAuthStateChange in sam preklopi na glavno navigacijo.
 */
export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim() || !password) {
      Alert.alert('Manjkajoči podatki', 'Vpiši e-pošto in geslo.');
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
      Alert.alert('Prijava ni uspela', e instanceof Error ? e.message : 'Poskusi znova.');
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      if (!data.session) {
        Alert.alert(
          'Preveri e-pošto',
          'Poslali smo ti potrditveno povezavo. Ko potrdiš e-pošto, se lahko prijaviš.',
        );
      }
    } catch (e) {
      console.error('[Auth] registracija ni uspela:', e);
      Alert.alert('Registracija ni uspela', e instanceof Error ? e.message : 'Poskusi znova.');
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
        <Text style={styles.title}>WorldMates</Text>
        <Text style={styles.subtitle}>Prijavi se ali ustvari nov račun</Text>

        <View style={styles.field}>
          <Text style={styles.label}>E-pošta</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ime@primer.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Geslo</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed, loading && styles.btnDisabled]}
          onPress={onSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryBtnText}>Prijava</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed, loading && styles.btnDisabled]}
          onPress={onSignUp}
          disabled={loading}
        >
          <Text style={styles.secondaryBtnText}>Registracija</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  title: { textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.textPrimary },
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

  secondaryBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnPressed: { opacity: 0.7 },
  secondaryBtnText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },

  btnDisabled: { opacity: 0.7 },
});
