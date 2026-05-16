import React, {useState, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, StatusBar} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withTiming} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useScheduleStore} from '../store/useScheduleStore';
import {Colors, Spacing, BorderRadius, Typography} from '../utils/theme';

const {width} = Dimensions.get('window');
type Props = {navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>};

const SLIDES = [
  {id: '1', emoji: '🛡️', title: 'Reclaim Your\nFocus', subtitle: 'Focus Shield blocks distracting apps so you can concentrate on what truly matters.', color: 'rgba(99,102,241,0.15)'},
  {id: '2', emoji: '⏰', title: 'Smart\nScheduling', subtitle: 'Create custom blocking schedules for any time of day — even overnight. Your rules, your way.', color: 'rgba(20,184,166,0.15)'},
  {id: '3', emoji: '⚡', title: 'Instant\nBlocking', subtitle: 'The moment you open a blocked app, Focus Shield takes over. No delays, no workarounds.', color: 'rgba(245,158,11,0.15)'},
  {id: '4', emoji: '📈', title: 'Build Better\nHabits', subtitle: 'Track your focus streaks, see time saved, and watch your productivity soar week over week.', color: 'rgba(16,185,129,0.15)'},
];

const PaginationDot: React.FC<{isActive: boolean}> = ({isActive}) => {
  const anim = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 28 : 8, {duration: 300}),
    backgroundColor: isActive ? Colors.primary : Colors.textMuted,
  }));
  return <Animated.View style={[styles.dot, anim]} />;
};

const OnboardingScreen: React.FC<Props> = ({navigation}) => {
  const [idx, setIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const {setHasOnboarded} = useScheduleStore();
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({transform: [{scale: btnScale.value}]}));

  const next = () => {
    if (idx < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({index: idx + 1, animated: true});
      setIdx(idx + 1);
    } else {
      setHasOnboarded(true);
      navigation.replace('Permissions');
    }
  };

  return (
    <LinearGradient colors={['#050810', '#0A0E1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <TouchableOpacity style={styles.skip} onPress={() => { setHasOnboarded(true); navigation.replace('Permissions'); }}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef} data={SLIDES} keyExtractor={i => i.id}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={false}
        style={{flex: 1}}
        renderItem={({item}) => (
          <View style={styles.slide}>
            <View style={[styles.iconCircle, {backgroundColor: item.color}]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => <PaginationDot key={i} isActive={idx === i} />)}
      </View>

      <View style={styles.bottom}>
        <Animated.View style={btnStyle}>
          <TouchableOpacity
            onPressIn={() => { btnScale.value = withSpring(0.96); }}
            onPressOut={() => { btnScale.value = withSpring(1); }}
            onPress={next} activeOpacity={1}>
            <LinearGradient colors={Colors.gradientPrimary} start={[0,0]} end={[1,0]} style={styles.nextBtn}>
              <Text style={styles.nextText}>{idx === SLIDES.length - 1 ? "Let's Go! 🚀" : 'Next →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.counter}>{idx + 1} / {SLIDES.length}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  skip: {
    position: 'absolute', top: 56, right: 24, zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999,
  },
  skipText: {color: Colors.textSecondary, fontSize: 14, fontWeight: '500'},
  slide: {
    width, flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 80, gap: 24,
  },
  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16,
  },
  emoji: {fontSize: 72},
  title: {fontSize: 36, fontWeight: '800', color: Colors.text, textAlign: 'center', lineHeight: 44},
  subtitle: {fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26},
  dots: {flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24},
  dot: {height: 8, borderRadius: 4},
  bottom: {paddingHorizontal: 24, paddingBottom: 48, gap: 16, alignItems: 'center'},
  nextBtn: {
    paddingHorizontal: 64, paddingVertical: 18, borderRadius: 999,
    alignItems: 'center', elevation: 8,
    shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 12,
  },
  nextText: {color: Colors.text, fontSize: 18, fontWeight: '700'},
  counter: {color: Colors.textMuted, fontSize: 12, fontWeight: '500'},
});

export default OnboardingScreen;
