import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { markOnboardingSeen } from '../lib/onboarding';
import { STRINGS } from '../constants/strings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Pin, ki "pade" na zemljevid in ob pristanku rahlo poskoči. */
function DropPinIllustration({ colors }: { colors: AppColors }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(translateY, { toValue: 0, duration: 600, easing: Easing.bounce, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 90, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }),
      ]),
    ]).start();
  }, [translateY, scale]);

  return (
    <View style={illustrationStyles.wrap}>
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <Ionicons name="location" size={72} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

/** Okrogel žig, ki se "natisne" – zavrti se in poskoči v velikosti, kot pri MetStampBadge. */
function StampIllustration({ colors }: { colors: AppColors }) {
  const scale = useRef(new Animated.Value(1.8)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [scale, rotate]);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['25deg', '-8deg'] });

  return (
    <View style={illustrationStyles.wrap}>
      <Animated.View
        style={[
          illustrationStyles.stampCircle,
          { borderColor: colors.primary, transform: [{ scale }, { rotate: rotateDeg }] },
        ]}
      >
        <Ionicons name="map-outline" size={34} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

/** Ikona, ki počasi lebdi gor-dol – nakazuje stalno povezanost. */
function ConnectedIllustration({ colors }: { colors: AppColors }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -10, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translateY]);

  return (
    <View style={illustrationStyles.wrap}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Ionicons name="paper-plane" size={68} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  wrap: { height: 140, alignItems: 'center', justifyContent: 'center' },
  stampCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type Page = {
  key: string;
  title: string;
  description: string;
  Illustration: React.ComponentType<{ colors: AppColors }>;
};

const PAGES: Page[] = [
  {
    key: 'save',
    title: STRINGS.onboarding.page1Title,
    description: STRINGS.onboarding.page1Description,
    Illustration: DropPinIllustration,
  },
  {
    key: 'atlas',
    title: STRINGS.onboarding.page2Title,
    description: STRINGS.onboarding.page2Description,
    Illustration: StampIllustration,
  },
  {
    key: 'connect',
    title: STRINGS.onboarding.page3Title,
    description: STRINGS.onboarding.page3Description,
    Illustration: ConnectedIllustration,
  },
];

/** Uvodni zasloni ob prvem odprtju app – glej hasSeenOnboarding/markOnboardingSeen v RootNavigator. */
export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const isLastPage = pageIndex === PAGES.length - 1;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  const goToNext = () => {
    const next = Math.min(pageIndex + 1, PAGES.length - 1);
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setPageIndex(next);
  };

  const finish = async () => {
    await markOnboardingSeen();
    onDone();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {PAGES.map((page) => (
          <View key={page.key} style={[styles.page, { width: SCREEN_WIDTH }]}>
            <page.Illustration colors={colors} />
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {PAGES.map((page, i) => (
            <View key={page.key} style={[styles.dot, i === pageIndex && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={isLastPage ? finish : goToNext}
        >
          <Text style={styles.primaryBtnText}>
            {isLastPage ? STRINGS.onboarding.getStartedButton : STRINGS.onboarding.nextButton}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    page: { alignItems: 'center', justifyContent: 'center', padding: 32 },
    title: {
      marginTop: 24,
      fontFamily: FONT_SERIF_BOLD,
      fontSize: 24,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    description: {
      marginTop: 10,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 300,
    },

    footer: { paddingHorizontal: 32, paddingBottom: 28, paddingTop: 12, gap: 20 },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 20 },

    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnPressed: { backgroundColor: colors.primaryDark },
    primaryBtnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  });
