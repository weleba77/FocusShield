import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated as RNAnimated} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import {Colors} from '../utils/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'BlockingPreview'>;
  route: RouteProp<RootStackParamList, 'BlockingPreview'>;
};

const MESSAGES = [
  "Your focus is your superpower. Stay strong! 💪",
  "Every minute you resist, you grow stronger. 🌱",
  "This time belongs to your future self. Invest it wisely. ✨",
  "The apps will still be there later. Your goals won't wait. 🎯",
  "Discipline is the bridge between goals and accomplishment. 🌉",
];

function formatEndTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const BlockingPreviewScreen: React.FC<Props> = ({navigation, route}) => {
  const {appName, endTime} = route.params;
  const message = MESSAGES[Date.now() % MESSAGES.length];

  const shieldAnim = useRef(new RNAnimated.Value(0)).current;
  const contentAnim = useRef(new RNAnimated.Value(0)).current;
  const pulse = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.sequence([
      RNAnimated.timing(shieldAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
      RNAnimated.timing(contentAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
    ]).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, {toValue: 1.08, duration: 1500, useNativeDriver: true}),
        RNAnimated.timing(pulse, {toValue: 1, duration: 1500, useNativeDriver: true}),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050810" />

      {/* Background glow */}
      <View style={styles.bgGlow} />

      <View style={styles.inner}>
        {/* Shield */}
        <RNAnimated.View
          style={[styles.shieldContainer, {
            opacity: shieldAnim,
            transform: [{scale: RNAnimated.add(0.5, RNAnimated.multiply(shieldAnim, 0.5))}],
          }]}>
          <RNAnimated.View style={[styles.glowRing, {transform: [{scale: pulse}]}]} />
          <View style={styles.shieldCircle}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </View>
        </RNAnimated.View>

        <RNAnimated.View style={[styles.content, {opacity: contentAnim, transform: [{translateY: RNAnimated.add(30, RNAnimated.multiply(contentAnim, -30))}]}]}>
          <View style={styles.blockedBadge}>
            <Text style={styles.blockedLabel}>APP BLOCKED</Text>
          </View>

          <Text style={styles.appName}>{appName}</Text>

          <View style={styles.divider} />

          <Text style={styles.message}>"{message}"</Text>

          {endTime && (
            <View style={styles.endTimeRow}>
              <Text style={styles.endTimeText}>Blocking ends at </Text>
              <Text style={styles.endTimeValue}>{formatEndTime(endTime)}</Text>
            </View>
          )}
        </RNAnimated.View>

        <RNAnimated.View style={[styles.buttons, {opacity: contentAnim}]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            style={styles.goBackBtn}>
            <LinearGradient colors={Colors.gradientPrimary} start={[0,0]} end={[1,0]} style={styles.goBackGrad}>
              <Text style={styles.goBackText}>← Go Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.expoBanner}>
            <Text style={styles.expoNote}>📱 This is a preview of the blocking screen</Text>
            <Text style={styles.expoNote}>Real blocking requires the native Android build</Text>
          </View>
        </RNAnimated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#050810'},
  bgGlow: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    top: '50%', left: '50%', transform: [{translateX: -200}, {translateY: -200}],
  },
  inner: {flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 80, paddingHorizontal: 32},
  shieldContainer: {alignItems: 'center', justifyContent: 'center'},
  glowRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  shieldCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  shieldEmoji: {fontSize: 64},
  content: {alignItems: 'center', gap: 20, width: '100%'},
  blockedBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)',
  },
  blockedLabel: {fontSize: 11, fontWeight: '800', color: Colors.primaryLight, letterSpacing: 3, textTransform: 'uppercase'},
  appName: {fontSize: 36, fontWeight: '800', color: Colors.text, textAlign: 'center'},
  divider: {width: '60%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)'},
  message: {fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26, fontStyle: 'italic'},
  endTimeRow: {flexDirection: 'row', alignItems: 'center'},
  endTimeText: {fontSize: 13, color: Colors.textMuted},
  endTimeValue: {fontSize: 13, fontWeight: '700', color: Colors.primaryLight},
  buttons: {width: '100%', gap: 16, alignItems: 'center'},
  goBackBtn: {width: '100%'},
  goBackGrad: {paddingVertical: 18, borderRadius: 999, alignItems: 'center', elevation: 8, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 12},
  goBackText: {color: Colors.text, fontSize: 16, fontWeight: '700'},
  expoBanner: {alignItems: 'center', gap: 4},
  expoNote: {fontSize: 11, color: Colors.textMuted, textAlign: 'center'},
});

export default BlockingPreviewScreen;
