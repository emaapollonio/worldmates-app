import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  message?: string;
};

/** Skupno "nalaganje" stanje – centriran spinner + besedilo, namesto praznega/belega zaslona. */
export default function LoadingState({ message = 'Nalaganje …' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  text: { fontSize: 14, color: colors.textSecondary },
});
