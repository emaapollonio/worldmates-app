import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { parseShareUrl, type PersonPrefill } from '../lib/qrShare';
import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { STRINGS } from '../constants/strings';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (prefill: PersonPrefill) => void;
};

/** Skener QR kod znotraj app – prebere isti "add-person" URL kot deep link. */
export default function QrScannerModal({ visible, onClose, onScanned }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [invalid, setInvalid] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (visible) {
      handledRef.current = false;
      setInvalid(false);
    }
  }, [visible]);

  const handleScan = ({ data }: { data: string }) => {
    if (handledRef.current) return;
    const prefill = parseShareUrl(data);
    if (!prefill) {
      setInvalid(true);
      return;
    }
    handledRef.current = true;
    onScanned(prefill);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>{STRINGS.addPerson.scanQrTitle}</Text>

        {permission?.granted ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleScan}
          />
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.hint}>{STRINGS.addPerson.scanQrPermission}</Text>
            <Pressable style={styles.primaryBtn} onPress={requestPermission}>
              <Text style={styles.primaryBtnText}>{STRINGS.addPerson.scanQrGrant}</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.hint, invalid && styles.invalid]}>
          {invalid ? STRINGS.addPerson.scanQrInvalid : STRINGS.addPerson.scanQrHint}
        </Text>

        <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
          <Text style={styles.closeBtnText}>{STRINGS.common.cancel}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 56, gap: 16 },
    title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    camera: { flex: 1, borderRadius: 16, overflow: 'hidden' },
    permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
    hint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
    invalid: { color: colors.danger, fontWeight: '600' },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
    primaryBtnText: { color: colors.onPrimary, fontWeight: '700' },
    closeBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 12,
    },
    closeBtnText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  });
