import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { listPendingRequests, acceptConnection, declineConnection, type PendingRequest } from '../lib/connections';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

/** Čakajoče zahteve za povezavo z drugih računov (Sprejmi / Zavrni). Ne izriše nič, če jih ni. */
export default function PendingConnectionsSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);

  const load = useCallback(async () => {
    try {
      setRequests(await listPendingRequests());
    } catch (e) {
      // Npr. migracija še ni zagnana – sekcija se preprosto ne prikaže.
      console.warn('[Connections] nalaganje zahtev ni uspelo:', e);
      setRequests([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const respond = async (request: PendingRequest, accept: boolean) => {
    try {
      if (accept) await acceptConnection(request.connection_id);
      else await declineConnection(request.connection_id);
      setRequests((prev) => prev.filter((r) => r.connection_id !== request.connection_id));
      if (accept) Toast.show({ type: 'success', text1: STRINGS.profile.connectionAcceptedToast, visibilityTime: 2000 });
    } catch (e) {
      console.error('[Connections] odgovor na zahtevo ni uspel:', e);
      Alert.alert(STRINGS.common.error, STRINGS.common.genericRetryMessage);
    }
  };

  if (requests.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{STRINGS.profile.connectionsTitle}</Text>
      {requests.map((request) => (
        <View key={request.connection_id} style={styles.card}>
          <Text style={styles.name}>
            {STRINGS.profile.connectionRequestFrom(request.display_name?.trim() || STRINGS.profile.connectionSomeone)}
          </Text>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => respond(request, true)} accessibilityRole="button">
              <Text style={styles.btnPrimaryText}>{STRINGS.profile.connectionAccept}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => respond(request, false)} accessibilityRole="button">
              <Text style={styles.btnText}>{STRINGS.profile.connectionDecline}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    section: { alignSelf: 'stretch', marginTop: 28, gap: 10 },
    title: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    name: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    actions: { flexDirection: 'row', gap: 10 },
    btn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    btnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    btnPrimaryText: { fontSize: 13, fontWeight: '700', color: colors.onPrimary },
  });
