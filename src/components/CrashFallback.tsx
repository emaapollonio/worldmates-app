import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Prikazan namesto app, če React drevo vrže napako pri renderiranju (ujame ga
 * Sentry.ErrorBoundary v App.tsx, ki napako hkrati pošlje v Sentry). Stoji
 * izven ThemeProvider-ja, zato namenoma uporablja fiksne barve in besedila.
 */
export default function CrashFallback() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>The error has been reported. Please close and reopen MetMap.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F1E6D2' },
  title: { fontSize: 20, fontWeight: '700', color: '#3A2E1F', textAlign: 'center' },
  message: { marginTop: 10, fontSize: 14, color: '#6B5A46', textAlign: 'center', lineHeight: 20 },
});
