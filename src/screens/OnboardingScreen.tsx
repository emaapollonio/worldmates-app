import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';

import { withAlpha, type AppColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { FONT_SERIF_BOLD } from '../theme/typography';
import { markOnboardingSeen } from '../lib/onboarding';
import { STRINGS } from '../constants/strings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Rahlo skicirana/obrisna "svetovna karta" – ne geografsko natančna
 * (namenoma abstraktni, ročno narisani "kontinenti"), z nekaj raztresenimi
 * pin-piki. V zelo bledih/prosojnih tonih teme, da ostane besedilo v
 * ospredju berljivo.
 */
function WorldMapSketch({ colors }: { colors: AppColors }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 260" style={StyleSheet.absoluteFill}>
      <Path
        d="M60,40 Q100,60 90,110 Q112,150 70,190 Q40,222 25,170 Q8,120 30,80 Q18,50 60,40 Z"
        fill="none"
        stroke={withAlpha(colors.primary, 0.28)}
        strokeWidth={2}
        strokeDasharray="6,5"
      />
      <Path
        d="M150,28 Q192,40 180,90 Q202,122 185,160 Q196,212 155,226 Q118,214 130,170 Q108,130 125,90 Q108,50 150,28 Z"
        fill="none"
        stroke={withAlpha(colors.secondary, 0.28)}
        strokeWidth={2}
        strokeDasharray="6,5"
      />
      <Path
        d="M232,58 Q282,48 300,90 Q312,130 280,150 Q292,182 250,196 Q210,190 215,150 Q194,110 215,90 Q208,68 232,58 Z"
        fill="none"
        stroke={withAlpha(colors.accent, 0.32)}
        strokeWidth={2}
        strokeDasharray="6,5"
      />
      <Circle cx={75} cy={95} r={5} fill={withAlpha(colors.primary, 0.4)} />
      <Circle cx={163} cy={115} r={5} fill={withAlpha(colors.secondary, 0.4)} />
      <Circle cx={258} cy={100} r={5} fill={withAlpha(colors.accent, 0.45)} />
    </Svg>
  );
}

/** Pin s siluto osebe znotraj, ki "pade" na mesto in ob pristanku rahlo poskoči. */
function PersonPinIllustration({ colors }: { colors: AppColors }) {
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
        <View style={[illustrationStyles.pinCircle, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={34} color={colors.onPrimary} />
        </View>
        <View style={[illustrationStyles.pinTip, { borderTopColor: colors.primary }]} />
      </Animated.View>
    </View>
  );
}

/** Majhen "zemljevid" (žigosana obroba) z več piniki, ki eden za drugim rahlo "poskočijo" na mesto. */
function MultiPinMapIllustration({ colors }: { colors: AppColors }) {
  const pins = [
    { top: 22, left: 20, color: colors.primary },
    { top: 55, left: 68, color: colors.secondary },
    { top: 18, left: 96, color: colors.accent },
  ];
  const scales = useRef(pins.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      140,
      scales.map((scale) => Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true })),
    ).start();
  }, [scales]);

  return (
    <View style={illustrationStyles.wrap}>
      <View style={[illustrationStyles.mapFrame, { borderColor: colors.primary, backgroundColor: colors.surfaceMuted }]}>
        {pins.map((pin, i) => (
          <Animated.View
            key={i}
            style={[
              illustrationStyles.mapPin,
              { top: pin.top, left: pin.left, backgroundColor: pin.color, transform: [{ scale: scales[i] }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  wrap: { height: 140, alignItems: 'center', justifyContent: 'center' },
  pinCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTip: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  mapFrame: {
    width: 140,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  mapPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});

type ContentPage = {
  key: string;
  title: string;
  description: string;
  Illustration: React.ComponentType<{ colors: AppColors }>;
};

const CONTENT_PAGES: ContentPage[] = [
  {
    key: 'save',
    title: STRINGS.onboarding.page1Title,
    description: STRINGS.onboarding.page1Description,
    Illustration: PersonPinIllustration,
  },
  {
    key: 'map',
    title: STRINGS.onboarding.page2Title,
    description: STRINGS.onboarding.page2Description,
    Illustration: MultiPinMapIllustration,
  },
];

const PAGE_COUNT = CONTENT_PAGES.length + 1; // + welcome

/** Uvodni zasloni ob prvem odprtju app – glej hasSeenOnboarding/markOnboardingSeen v RootNavigator. */
export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [pageIndex, setPageIndex] = useState(0);
  const isLastPage = pageIndex === PAGE_COUNT - 1;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
  });

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  const goToNext = () => {
    const next = Math.min(pageIndex + 1, PAGE_COUNT - 1);
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setPageIndex(next);
  };

  const finish = async () => {
    await markOnboardingSeen();
    onDone();
  };

  return (
    <SafeAreaView style={styles.screen}>
      {!isLastPage ? (
        <Pressable style={styles.skipBtn} onPress={finish} hitSlop={10}>
          <Text style={styles.skipBtnText}>{STRINGS.onboarding.skipButton}</Text>
        </Pressable>
      ) : null}

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {/* Zaslon 1: dobrodošlica z bledo skico svetovne karte v ozadju. */}
        <View style={[styles.page, styles.welcomePage, { width: SCREEN_WIDTH }]}>
          <WorldMapSketch colors={colors} />
          <Text style={styles.welcomeTitle}>{STRINGS.onboarding.welcomeTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{STRINGS.onboarding.welcomeSubtitle}</Text>
        </View>

        {CONTENT_PAGES.map((page, i) => {
          const pageNumber = i + 1;
          const inputRange = [(pageNumber - 1) * SCREEN_WIDTH, pageNumber * SCREEN_WIDTH, (pageNumber + 1) * SCREEN_WIDTH];
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          const translateY = scrollX.interpolate({ inputRange, outputRange: [14, 0, 14], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={page.key}
              style={[styles.page, { width: SCREEN_WIDTH, opacity, transform: [{ translateY }] }]}
            >
              <page.Illustration colors={colors} />
              <Text style={styles.title}>{page.title}</Text>
              <Text style={styles.description}>{page.description}</Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {Array.from({ length: PAGE_COUNT }).map((_, i) => (
            <View key={i} style={[styles.dot, i === pageIndex && styles.dotActive]} />
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
    // colors.surface (namesto colors.background) – rahlo svetlejše/bolj zračno
    // kot glavna app, da onboarding deluje sveže in ne pretežko.
    screen: { flex: 1, backgroundColor: colors.surface },
    skipBtn: {
      position: 'absolute',
      top: 14,
      right: 20,
      zIndex: 10,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    skipBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

    page: { alignItems: 'center', justifyContent: 'center', padding: 32 },
    welcomePage: { overflow: 'hidden' },
    welcomeTitle: {
      fontFamily: FONT_SERIF_BOLD,
      fontSize: 32,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    welcomeSubtitle: {
      marginTop: 12,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 280,
    },

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
