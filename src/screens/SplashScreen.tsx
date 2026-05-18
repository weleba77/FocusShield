import React, {useEffect} from 'react';
import {View, Text, StyleSheet, StatusBar} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, withSequence, Easing,
} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {Shield} from 'lucide-react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useScheduleStore} from '../store/useScheduleStore';
import {Colors, Typography} from '../utils/theme';

type Props = {navigation: StackNavigationProp<RootStackParamList, 'Splash'>};

const SplashScreen: React.FC<Props> = ({navigation}) => {
  const {hasOnboarded} = useScheduleStore();
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(30);
  const taglineOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);

  const navigate = () => {
    if (!hasOnboarded) navigation.replace('Onboarding');
    else navigation.replace('MainTabs');
  };

  useEffect(() => {
    logoScale.value = withSpring(1, {damping: 12, stiffness: 100});
    logoOpacity.value = withTiming(1, {duration: 600});
    glowOpacity.value = withDelay(300, withTiming(1, {duration: 500}));
    glowScale.value = withDelay(300, withSequence(
      withTiming(1.5, {duration: 1000, easing: Easing.out(Easing.ease)}),
      withTiming(1.2, {duration: 800}),
    ));
    titleOpacity.value = withDelay(500, withTiming(1, {duration: 700}));
    titleY.value = withDelay(500, withSpring(0, {damping: 15}));
    taglineOpacity.value = withDelay(800, withTiming(1, {duration: 600}));
    const timer = setTimeout(navigate, 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({transform: [{scale: logoScale.value}], opacity: logoOpacity.value}));
  const glowStyle = useAnimatedStyle(() => ({transform: [{scale: glowScale.value}], opacity: glowOpacity.value}));
  const titleStyle = useAnimatedStyle(() => ({opacity: titleOpacity.value, transform: [{translateY: titleY.value}]}));
  const taglineStyle = useAnimatedStyle(() => ({opacity: taglineOpacity.value}));

  return (
    <LinearGradient colors={['#050810', '#0A0E1A', '#0D1528']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.glow, glowStyle]} />
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <LinearGradient colors={['rgba(99,102,241,0.2)', 'rgba(168,85,247,0.1)']} style={styles.logoCircle}>
            <Shield color="#818CF8" size={72} strokeWidth={1.5} />
          </LinearGradient>
        </Animated.View>
        <Animated.Text style={[styles.appName, titleStyle]}>Focus Shield</Animated.Text>
        <Animated.Text style={[styles.tagline, taglineStyle]}>Your focus, protected.</Animated.Text>
      </View>
      <Animated.View style={[styles.expoBadge, taglineStyle]}>
        <Text style={styles.expoText}>📱 Expo Preview Mode</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  content: {alignItems: 'center', gap: 20},
  glow: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  logoContainer: {marginBottom: 8},
  logoCircle: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  appName: {fontSize: 38, fontWeight: '800', color: Colors.text, letterSpacing: 1},
  tagline: {fontSize: 14, color: Colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500'},
  expoBadge: {
    position: 'absolute', bottom: 48,
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
  },
  expoText: {fontSize: 12, color: Colors.primaryLight, fontWeight: '600'},
});

export default SplashScreen;
