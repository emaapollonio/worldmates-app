import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIC_ENABLED_KEY = 'metmap_biometric_login_enabled';

/** Ali naprava sploh podpira biometrijo IN ima vsaj en prstni odtis/obraz registriran. */
export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

/** Ali je uporabnik v nastavitvah vklopil biometrično odklepanje app. */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  return value === 'true';
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/** Poženi Face ID / prstni odtis. Vrne true samo ob uspešni potrditvi. */
export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage });
  return result.success;
}
