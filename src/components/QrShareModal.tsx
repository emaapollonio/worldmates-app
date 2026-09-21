import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import type { ProfileRow } from '../lib/profiles';
import { buildShareUrl, type PersonPrefill } from '../lib/qrShare';
import { palette, type AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

type Props = {
  visible: boolean;
  onClose: () => void;
  profile: ProfileRow | null;
  /** E-pošta računa – ponujena samo kot izrecna, privzeto izklopljena izbira. */
  email: string | null;
};

type Field = 'firstName' | 'lastName' | 'country' | 'city' | 'contact';

function splitName(displayName: string | null | undefined): { first?: string; last?: string } {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  return { first: parts[0], last: parts.slice(1).join(' ') || undefined };
}

/** "Moja QR koda": uporabnik s checkboxi izbere, kaj se zakodira v (navaden URL) QR. Kontakt je privzeto izklopljen. */
export default function QrShareModal({ visible, onClose, profile, email }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<Record<Field, boolean>>({
    firstName: true,
    lastName: true,
    country: true,
    city: true,
    contact: false,
  });

  // Ob vsakem odprtju se kontakt spet ponastavi na izklopljeno.
  useEffect(() => {
    if (visible) setSelected((prev) => ({ ...prev, contact: false }));
  }, [visible]);

  const name = splitName(profile?.display_name);
  const available: Record<Field, string | undefined | null> = {
    firstName: name.first,
    lastName: name.last,
    country: profile?.home_country,
    city: profile?.home_city,
    contact: email,
  };

  const prefill: PersonPrefill = {
    firstName: selected.firstName ? name.first : undefined,
    lastName: selected.lastName ? name.last : undefined,
    country: selected.country ? (profile?.home_country ?? undefined) : undefined,
    city: selected.city ? (profile?.home_city ?? undefined) : undefined,
    ...(selected.contact && email ? { contactType: 'email' as const, contactValue: email } : {}),
  };
  const hasAnything = Object.values(prefill).some(Boolean);

  const rows: { field: Field; label: string }[] = [
    { field: 'firstName', label: STRINGS.profile.qrFirstName },
    { field: 'lastName', label: STRINGS.profile.qrLastName },
    { field: 'country', label: STRINGS.profile.qrHomeCountry },
    { field: 'city', label: STRINGS.profile.qrHomeCity },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{STRINGS.profile.qrTitle}</Text>
            <Text style={styles.description}>{STRINGS.profile.qrDescription}</Text>

            {rows.map(({ field, label }) => {
              const value = available[field];
              const disabled = !value;
              const checked = selected[field] && !disabled;
              return (
                <Pressable
                  key={field}
                  style={styles.row}
                  disabled={disabled}
                  onPress={() => setSelected((prev) => ({ ...prev, [field]: !prev[field] }))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked, disabled }}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={disabled ? colors.textMuted : colors.primary}
                  />
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>{label}</Text>
                    <Text style={styles.rowValue}>{value || '—'}</Text>
                  </View>
                </Pressable>
              );
            })}
            {!name.first ? <Text style={styles.hint}>{STRINGS.profile.qrNameHint}</Text> : null}

            {email ? (
              <View style={styles.contactBox}>
                <Pressable
                  style={styles.row}
                  onPress={() => setSelected((prev) => ({ ...prev, contact: !prev.contact }))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected.contact }}
                >
                  <Ionicons name={selected.contact ? 'checkbox' : 'square-outline'} size={22} color={colors.danger} />
                  <Text style={styles.rowLabel}>{STRINGS.profile.qrContactToggle}</Text>
                </Pressable>
                <Text style={styles.warning}>{STRINGS.profile.qrContactWarning}</Text>
              </View>
            ) : null}

            <View style={styles.qrWrap}>
              {hasAnything ? (
                // Fiksne barve (črna na kremni) – QR mora biti berljiv tudi v dark mode.
                <QRCode value={buildShareUrl(prefill)} size={210} color="#000000" backgroundColor={palette.cream} />
              ) : (
                <Text style={styles.hint}>{STRINGS.profile.qrNothingSelected}</Text>
              )}
            </View>
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeBtnText}>{STRINGS.profile.qrClose}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      maxHeight: '90%',
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 28,
    },
    content: { gap: 10 },
    title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    description: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, color: colors.textPrimary, flexShrink: 1 },
    rowLabelDisabled: { color: colors.textMuted },
    rowValue: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
    contactBox: { marginTop: 6, borderWidth: 1, borderColor: colors.danger, borderRadius: 12, padding: 10, gap: 4 },
    warning: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
    qrWrap: { alignItems: 'center', justifyContent: 'center', minHeight: 240, marginTop: 8 },
    closeBtn: {
      marginTop: 14,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    closeBtnText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  });
