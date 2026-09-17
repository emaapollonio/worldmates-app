import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { STRINGS } from '../constants/strings';

type Props = {
  name: string;
  location: string;
  photoUrl: string | null;
};

/**
 * Kartica za deljenje – zajeta kot slika prek react-native-view-shot
 * (glej onShare v PersonProfileScreen). Vedno v svetli, topli temi
 * (ne sledi dark mode), da je videti enako ne glede na to, kdo jo prejme.
 * Ni namenjena prikazu na zaslonu – renderira se izven vidnega polja.
 */
const ShareCard = forwardRef<View, Props>(({ name, location, photoUrl }, ref) => {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="person" size={64} color={colors.textMuted} />
        </View>
      )}

      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>

      <View style={styles.locationRow}>
        <Ionicons name="location" size={16} color={colors.onPrimary} />
        <Text style={styles.location} numberOfLines={1}>
          {location}
        </Text>
      </View>

      <View style={styles.logoBadge}>
        <Ionicons name="earth" size={14} color={colors.onPrimary} />
        <Text style={styles.logoText}>{STRINGS.common.appName}</Text>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;

const CARD_WIDTH = 360;
const CARD_HEIGHT = 480;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  photo: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 4,
    borderColor: colors.onPrimary,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: {
    marginTop: 22,
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 30,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  location: { fontSize: 16, color: colors.onPrimary, opacity: 0.9 },
  logoBadge: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logoText: { fontSize: 12, fontWeight: '700', color: colors.onPrimary },
});
