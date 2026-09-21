import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Za navigacijo iz kode zunaj zaslonov (npr. deep link v RootNavigator). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
