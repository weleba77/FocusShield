import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {
  Shield,
  Trash2,
  GitBranch,
  RotateCcw,
  Sliders,
  HelpCircle,
  Activity,
  ChevronRight,
  Eye,
} from 'lucide-react-native';
import {useScheduleStore} from '../store/useScheduleStore';
import {Colors, Spacing} from '../utils/theme';

export default function SettingsScreen({navigation}: any) {
  const {
    stats,
    resetStats,
    setHasOnboarded,
    setHasPermissions,
    schedules,
  } = useScheduleStore();

  // Simulated Protection States
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [muteNotifications, setMuteNotifications] = useState<boolean>(true);
  const [newArchOptimizer, setNewArchOptimizer] = useState<boolean>(true);

  // Computed variables
  const activeSchedulesCount = schedules.filter(s => s.isEnabled).length;
  const timeSavedHours = Math.floor((stats.totalBlockedAttempts * 3) / 60);

  // Trigger Onboarding Reset
  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will log you out to the splash screen and restart the Onboarding and Permissions screens. Proceed?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setHasOnboarded(false);
            setHasPermissions(false);
            navigation.replace('Splash');
          },
        },
      ]
    );
  };

  // Trigger Stats Reset
  const handleResetStats = () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to clear your focus minutes and block attempts? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetStats();
            Alert.alert('Stats Reset', 'Your statistics have been cleared successfully.');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#050810', '#0A0E1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Configure shield preferences and statistics</Text>
        </View>

        {/* Statistics Dashboard Panel */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Activity color={Colors.primaryLight} size={18} />
            <Text style={styles.sectionTitle}>Focus Statistics</Text>
          </View>

          <View style={styles.statsPanel}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Focus Minutes</Text>
              <Text style={styles.statValue}>{stats.totalFocusMinutes} mins</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Distractions Blocked</Text>
              <Text style={styles.statValue}>{stats.totalBlockedAttempts} times</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Time Saved</Text>
              <Text style={[styles.statValue, {color: Colors.success}]}>{timeSavedHours} hours</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Focus Day Streak</Text>
              <Text style={[styles.statValue, {color: '#F59E0B'}]}>{stats.streak} days 🔥</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleResetStats} style={styles.dangerStatsBtn} activeOpacity={0.75}>
            <Trash2 color={Colors.danger} size={14} />
            <Text style={styles.dangerStatsText}>Clear Core Statistics</Text>
          </TouchableOpacity>
        </View>

        {/* Protection Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Sliders color={Colors.primaryLight} size={18} />
            <Text style={styles.sectionTitle}>Shield Configurations</Text>
          </View>

          <View style={styles.settingsGroup}>
            {/* Strict Mode Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingLabel}>Strict Focus Mode</Text>
                <Text style={styles.settingDesc}>Prevents stopping the focus timer once started.</Text>
              </View>
              <Switch
                value={strictMode}
                onValueChange={setStrictMode}
                trackColor={{false: '#2D3748', true: 'rgba(99,102,241,0.4)'}}
                thumbColor={strictMode ? Colors.primary : '#718096'}
              />
            </View>
            
            <View style={styles.divider} />

            {/* Shield Notifications Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingLabel}>Shield Notifications</Text>
                <Text style={styles.settingDesc}>Mutes annoying social media notifications.</Text>
              </View>
              <Switch
                value={muteNotifications}
                onValueChange={setMuteNotifications}
                trackColor={{false: '#2D3748', true: 'rgba(99,102,241,0.4)'}}
                thumbColor={muteNotifications ? Colors.primary : '#718096'}
              />
            </View>

            <View style={styles.divider} />

            {/* New Architecture Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingLabel}>Hermes & New Arch Optimizer</Text>
                <Text style={styles.settingDesc}>Keeps import.meta and JSI runtime fully optimized.</Text>
              </View>
              <Switch
                value={newArchOptimizer}
                onValueChange={setNewArchOptimizer}
                trackColor={{false: '#2D3748', true: 'rgba(99,102,241,0.4)'}}
                thumbColor={newArchOptimizer ? Colors.primary : '#718096'}
              />
            </View>
          </View>
        </View>

        {/* Tools and Helpers */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <HelpCircle color={Colors.primaryLight} size={18} />
            <Text style={styles.sectionTitle}>Tools & Testing Options</Text>
          </View>

          <View style={styles.settingsGroup}>
            {/* Overlay Block Preview */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('BlockingPreview', {appName: 'Instagram', endTime: '18:00'})}
              style={styles.settingItemTouchable} 
              activeOpacity={0.8}
            >
              <View style={styles.touchableContent}>
                <Eye color={Colors.textSecondary} size={18} />
                <Text style={styles.touchableLabel}>Preview Shield Overlay Screen</Text>
              </View>
              <ChevronRight color={Colors.textMuted} size={18} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Reset Onboarding State */}
            <TouchableOpacity onPress={handleResetOnboarding} style={styles.settingItemTouchable} activeOpacity={0.8}>
              <View style={styles.touchableContent}>
                <RotateCcw color={Colors.textSecondary} size={18} />
                <Text style={styles.touchableLabel}>Reset Onboarding Walkthrough</Text>
              </View>
              <ChevronRight color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer & Git Meta Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <GitBranch color={Colors.primaryLight} size={18} />
            <Text style={styles.sectionTitle}>Developer & Git Meta</Text>
          </View>

          <View style={styles.gitPanel}>
            <View style={styles.gitMetaItem}>
              <GitBranch color={Colors.textSecondary} size={16} />
              <View style={styles.gitTextContent}>
                <Text style={styles.gitMetaLabel}>Repository URL</Text>
                <Text style={styles.gitMetaValue} numberOfLines={1}>
                  https://github.com/weleba77/FocusShield.git
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.gitMetaItem}>
              <Shield color={Colors.textSecondary} size={16} />
              <View style={styles.gitTextContent}>
                <Text style={styles.gitMetaLabel}>Author Profile</Text>
                <Text style={styles.gitMetaValue}>weleba77 (ephremweleba@gmail.com)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.gitMetaItem}>
              <Sliders color={Colors.textSecondary} size={16} />
              <View style={styles.gitTextContent}>
                <Text style={styles.gitMetaLabel}>Active Block Schedules</Text>
                <Text style={styles.gitMetaValue}>{activeSchedulesCount} Schedules Monitored</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>Focus Shield Expo v1.0.0 • Verified Build</Text>
        <View style={{height: 40}} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {paddingHorizontal: 24, paddingTop: 64, paddingBottom: 100},
  header: {marginBottom: Spacing.xl, gap: 4},
  headerTitle: {fontSize: 26, fontWeight: '800', color: Colors.text},
  headerSubtitle: {fontSize: 12, color: Colors.textSecondary},
  
  section: {marginBottom: Spacing.xl},
  sectionHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm},
  sectionTitle: {fontSize: 14, fontWeight: '700', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.8},

  statsPanel: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  statRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  statLabel: {fontSize: 13, color: Colors.textSecondary, fontWeight: '500'},
  statValue: {fontSize: 14, fontWeight: '700', color: Colors.text},
  
  dangerStatsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dangerStatsText: {fontSize: 12, fontWeight: '600', color: Colors.danger},

  settingsGroup: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingTextContent: {flex: 1, marginRight: Spacing.md, gap: 2},
  settingLabel: {fontSize: 14, fontWeight: '600', color: Colors.text},
  settingDesc: {fontSize: 10, color: Colors.textSecondary, lineHeight: 14},

  settingItemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  touchableContent: {flexDirection: 'row', alignItems: 'center', gap: 10},
  touchableLabel: {fontSize: 13, fontWeight: '600', color: Colors.text},

  gitPanel: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  gitMetaItem: {flexDirection: 'row', alignItems: 'center', gap: 12},
  gitTextContent: {flex: 1, gap: 2},
  gitMetaLabel: {fontSize: 11, color: Colors.textSecondary, fontWeight: '500'},
  gitMetaValue: {fontSize: 12, fontWeight: '700', color: Colors.text, maxWidth: 240},

  divider: {height: 1, backgroundColor: 'rgba(255,255,255,0.04)'},
  footerText: {fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm},
});
