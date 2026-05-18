import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert} from 'react-native';
import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {Eye, Layers, ChevronRight, CheckCircle2, Shield} from 'lucide-react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useScheduleStore} from '../store/useScheduleStore';
import {Colors, Spacing, BorderRadius, Typography} from '../utils/theme';

type Props = {navigation: StackNavigationProp<RootStackParamList, 'Permissions'>};

const PermissionsScreen: React.FC<Props> = ({navigation}) => {
  const {setHasPermissions} = useScheduleStore();
  // In Expo preview, simulate both permissions as granted
  const [granted, setGranted] = useState({usageStats: false, overlay: false});

  const grantMock = (key: 'usageStats' | 'overlay') => {
    Alert.alert(
      '📱 Expo Preview Mode',
      `In the real app, this would open Android Settings to enable "${key === 'usageStats' ? 'Usage Access' : 'Display Over Apps'}" permission.\n\nFor this preview, tap OK to simulate granting it.`,
      [{text: 'OK', onPress: () => setGranted(prev => ({...prev, [key]: true}))}],
    );
  };

  const allGranted = granted.usageStats && granted.overlay;

  const handleContinue = () => {
    setHasPermissions(true);
    navigation.replace('MainTabs');
  };

  const permissions = [
    {
      id: 'usageStats' as const,
      title: 'Usage Access',
      description: 'Required to detect which app is currently open so Focus Shield can block it.',
      icon: <Eye color={granted.usageStats ? Colors.success : Colors.primary} size={28} />,
    },
    {
      id: 'overlay' as const,
      title: 'Display Over Apps',
      description: 'Required to show the blocking screen on top of any app you try to open.',
      icon: <Layers color={granted.overlay ? Colors.success : Colors.primary} size={28} />,
    },
  ];

  return (
    <LinearGradient colors={['#050810', '#0A0E1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <LinearGradient colors={['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.05)']} style={styles.headerIcon}>
            <Shield color="#818CF8" size={48} strokeWidth={1.5} />
          </LinearGradient>
          <Text style={styles.title}>Enable Permissions</Text>
          <Text style={styles.subtitle}>Focus Shield needs two permissions to protect your focus.</Text>
          <View style={styles.expoBanner}>
            <Text style={styles.expoText}>📱 Expo Preview — tap to simulate granting</Text>
          </View>
        </Animated.View>

        <View style={styles.permsContainer}>
          {permissions.map((perm, i) => {
            const isGranted = granted[perm.id];
            return (
              <Animated.View key={perm.id} entering={FadeInUp.delay(200 + i * 150).springify()}>
                <TouchableOpacity
                  style={[styles.permCard, isGranted && styles.permCardGranted]}
                  onPress={() => !isGranted && grantMock(perm.id)}
                  activeOpacity={0.8}>
                  <View style={[styles.permIcon, isGranted && styles.permIconGranted]}>
                    {isGranted ? <CheckCircle2 color={Colors.success} size={28} /> : perm.icon}
                  </View>
                  <View style={styles.permText}>
                    <View style={styles.permTitleRow}>
                      <Text style={styles.permTitle}>{perm.title}</Text>
                      {isGranted && (
                        <View style={styles.grantedBadge}>
                          <Text style={styles.grantedText}>Granted ✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.permDesc}>{perm.description}</Text>
                    {!isGranted && (
                      <View style={styles.tapRow}>
                        <Text style={styles.tapText}>Tap to simulate</Text>
                        <ChevronRight color={Colors.primary} size={14} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInUp.delay(550).springify()} style={styles.infoBox}>
          <Text style={styles.infoText}>🔒 These permissions only run on your device. No data is ever sent to any server.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).springify()} style={styles.btnContainer}>
          <TouchableOpacity onPress={handleContinue} disabled={!allGranted} activeOpacity={0.85}>
            <LinearGradient
              colors={allGranted ? Colors.gradientPrimary : (['#1E2640', '#1E2640'] as [string, string])}
              start={[0, 0]} end={[1, 0]}
              style={[styles.continueBtn, !allGranted && styles.disabledBtn]}>
              <Text style={[styles.continueText, !allGranted && styles.disabledText]}>
                {allGranted ? 'Continue →' : 'Grant Both Permissions to Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {padding: Spacing.lg, paddingTop: 72, paddingBottom: 48},
  header: {alignItems: 'center', marginBottom: Spacing.xl, gap: 16},
  headerIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
  },
  title: {fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center'},
  subtitle: {fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16},
  expoBanner: {
    backgroundColor: 'rgba(168,85,247,0.1)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
  },
  expoText: {fontSize: 12, color: '#C084FC', fontWeight: '600'},
  permsContainer: {gap: Spacing.md},
  permCard: {
    backgroundColor: '#141B2D', borderRadius: 16, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)',
  },
  permCardGranted: {borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.05)'},
  permIcon: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  permIconGranted: {backgroundColor: 'rgba(16,185,129,0.1)'},
  permText: {flex: 1, gap: 4},
  permTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  permTitle: {fontSize: 16, fontWeight: '700', color: Colors.text},
  grantedBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  grantedText: {fontSize: 10, color: Colors.success, fontWeight: '600'},
  permDesc: {fontSize: 12, color: Colors.textSecondary, lineHeight: 20},
  tapRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4},
  tapText: {fontSize: 12, color: Colors.primary, fontWeight: '600'},
  infoBox: {
    marginTop: Spacing.lg, padding: Spacing.md,
    backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
  },
  infoText: {fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20},
  btnContainer: {marginTop: Spacing.xl},
  continueBtn: {paddingVertical: 18, borderRadius: 999, alignItems: 'center', elevation: 8, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 12},
  disabledBtn: {elevation: 0, shadowOpacity: 0},
  continueText: {fontSize: 18, fontWeight: '700', color: Colors.text},
  disabledText: {color: Colors.textMuted},
});

export default PermissionsScreen;
