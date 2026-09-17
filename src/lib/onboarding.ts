import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_FLAG_KEY = 'has_seen_onboarding';

/** Ali je uporabnik že videl uvodni onboarding (prikaže se samo ob prvem odprtju app). */
export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_FLAG_KEY);
  return value === 'true';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_FLAG_KEY, 'true');
}
