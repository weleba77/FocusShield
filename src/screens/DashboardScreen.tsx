import React, {useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar, Alert} from 'react-native';
import Animated, {FadeInUp, FadeInDown, Layout} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {Plus, Settings, Shield, Clock, Trash2, Flame, Target, Zap} from 'lucide-react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useScheduleStore, BlockSchedule} from '../store/useScheduleStore';
import {formatTime, getDaysLabel, isScheduleActive} from '../utils/scheduleUtils';
import {Colors, Spacing, BorderRadius, Typography} from '../utils/theme';

type Props = {navigation: any};

const StatCard: React.FC<{icon: React.ReactNode; value: string; label: string; gradient: string[]; delay?: number}> = ({icon, value, label, gradient, delay = 0}) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={styles.statCardWrapper}>
    <LinearGradient colors={gradient as [string, string]} style={styles.statCard}>
      <View style={styles.statIconBox}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </Animated.View>
);

const ScheduleCard: React.FC<{
  schedule: BlockSchedule;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPreview: () => void;
  isActiveOverride?: boolean;
}> = ({schedule, onToggle, onDelete, onEdit, onPreview, isActiveOverride}) => {
  const active = isActiveOverride !== undefined ? isActiveOverride : isScheduleActive(schedule);
  return (
    <Animated.View layout={Layout.springify()} entering={FadeInUp.springify()}>
      <TouchableOpacity style={[styles.scheduleCard, active && styles.scheduleCardActive]} onPress={onEdit} activeOpacity={0.85}>
        {active && (
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>Active Now</Text>
          </View>
        )}
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleName} numberOfLines={1}>{schedule.name}</Text>
            <Text style={styles.scheduleTime}>{formatTime(schedule.startTime)} → {formatTime(schedule.endTime)}</Text>
            <Text style={styles.scheduleDays}>{getDaysLabel(schedule.days)}</Text>
          </View>
          <Switch
            value={schedule.isEnabled}
            onValueChange={onToggle}
            trackColor={{false: '#2D3748', true: 'rgba(99,102,241,0.4)'}}
            thumbColor={schedule.isEnabled ? Colors.primary : '#718096'}
          />
        </View>
        <View style={styles.scheduleFooter}>
          <View style={styles.appsChips}>
            {schedule.blockedApps.slice(0, 3).map(app => (
              <View key={app.packageName} style={styles.appChip}>
                <Text style={styles.appChipText} numberOfLines={1}>{app.appName}</Text>
              </View>
            ))}
            {schedule.blockedApps.length > 3 && (
              <View style={styles.appChip}><Text style={styles.appChipText}>+{schedule.blockedApps.length - 3}</Text></View>
            )}
          </View>
          <View style={styles.footerActions}>
            {schedule.blockedApps.length > 0 && (
              <TouchableOpacity onPress={onPreview} style={styles.previewBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={styles.previewBtnText}>Preview Block</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Trash2 color={Colors.danger} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const DashboardScreen: React.FC<Props> = ({navigation}) => {
  const {schedules, stats, toggleSchedule, deleteSchedule, getNextBlockTime, incrementBlockedAttempts, activeSession} = useScheduleStore();

  const activeCount = schedules.filter(s => s.isEnabled && isScheduleActive(s)).length;
  const totalAppsBlocked = [...new Set(schedules.flatMap(s => s.blockedApps.map(a => a.packageName)))].length;
  const nextBlockTime = getNextBlockTime();
  const timeSavedHours = Math.floor((stats.totalBlockedAttempts * 3) / 60);

  const handlePreview = useCallback((schedule: BlockSchedule) => {
    const app = schedule.blockedApps[0];
    navigation.navigate('BlockingPreview', {appName: app.appName, endTime: schedule.endTime});
  }, [navigation]);

  const handleSimulateAppLaunch = useCallback((app: any, schedule: BlockSchedule) => {
    const isEnforcedByFocus = activeSession && activeSession.enforcedScheduleId === schedule.id;
    const activeSchedule = schedules.find(s => 
      s.isEnabled && 
      (isScheduleActive(s) || (activeSession && activeSession.enforcedScheduleId === s.id)) && 
      s.blockedApps.some(a => a.packageName === app.packageName)
    );

    if (activeSchedule) {
      incrementBlockedAttempts();
      const endTimeDisplay = (activeSession && activeSession.enforcedScheduleId === activeSchedule.id)
        ? new Date(activeSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : formatTime(activeSchedule.endTime);
      navigation.navigate('BlockingPreview', {appName: app.appName, endTime: endTimeDisplay});
    } else {
      Alert.alert(
        'App Opened: Allowed',
        `"${app.appName}" opened successfully!\n\nIt is NOT blocked right now because its schedule ("${schedule.name}") is either disabled, outside its active time block (${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}), or not paired with an active Focus session.`,
        [
          { text: 'Got it' },
          { 
            text: 'Force Enable Schedule', 
            onPress: () => {
              toggleSchedule(schedule.id);
            }
          }
        ]
      );
    }
  }, [schedules, toggleSchedule, incrementBlockedAttempts, navigation, activeSession]);

  const uniqueBlockedApps = schedules.flatMap(s => 
    s.blockedApps.map(app => ({ ...app, schedule: s }))
  ).filter((app, index, self) => 
    self.findIndex(a => a.packageName === app.packageName) === index
  );

  const renderEmpty = () => (
    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.emptyState}>
      <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)']} style={styles.emptyIcon}>
        <Shield color="#818CF8" size={48} strokeWidth={1.5} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Schedules Yet</Text>
      <Text style={styles.emptySubtitle}>Create your first focus schedule to start blocking distractions.</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Schedules')} activeOpacity={0.85}>
        <LinearGradient colors={Colors.gradientPrimary} start={[0,0]} end={[1,0]} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>Create Schedule</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#050810', '#0A0E1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()} style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>Focus Shield</Text>
            {activeCount > 0 ? (
              <View style={styles.statusRow}>
                <View style={styles.liveIndicator} />
                <Text style={styles.statusText}>{activeCount} session{activeCount > 1 ? 's' : ''} active</Text>
              </View>
            ) : (
              <Text style={styles.statusText}>Your focus, protected</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <Settings color={Colors.textSecondary} size={22} />
          </TouchableOpacity>
        </Animated.View>

        {nextBlockTime && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <LinearGradient colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.08)']} style={styles.nextBanner}>
              <Clock color={Colors.primaryLight} size={18} />
              <Text style={styles.nextText}>Next block: <Text style={styles.nextTimeText}>{nextBlockTime}</Text></Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={styles.statsGrid}>
          <StatCard icon={<Flame color="#F59E0B" size={22} />} value={`${stats.streak}`} label="Day Streak" gradient={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)']} delay={100} />
          <StatCard icon={<Shield color={Colors.primaryLight} size={22} />} value={`${stats.totalBlockedAttempts}`} label="Blocked" gradient={['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.05)']} delay={150} />
          <StatCard icon={<Target color={Colors.teal} size={22} />} value={`${totalAppsBlocked}`} label="Apps" gradient={['rgba(20,184,166,0.2)', 'rgba(20,184,166,0.05)']} delay={200} />
          <StatCard icon={<Clock color="#A855F7" size={22} />} value={`${timeSavedHours}h`} label="Saved" gradient={['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.05)']} delay={250} />
        </View>

        {uniqueBlockedApps.length > 0 && (
          <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.simBox}>
            <LinearGradient
              colors={['rgba(99,102,241,0.18)', 'rgba(168,85,247,0.06)']}
              style={styles.simContainer}
            >
              <View style={styles.simHeader}>
                <Zap color="#A855F7" size={18} />
                <Text style={styles.simTitle}>Simulated Distraction Tester</Text>
              </View>
              <Text style={styles.simSubtitle}>
                Tap any of your chosen apps below to simulate opening it. If its schedule is active, it will be strictly blocked!
              </Text>
              <View style={styles.simAppsRow}>
                {uniqueBlockedApps.map((app) => {
                  const active = (isScheduleActive(app.schedule) || (activeSession && activeSession.enforcedScheduleId === app.schedule.id)) && app.schedule.isEnabled;
                  return (
                    <TouchableOpacity
                      key={app.packageName}
                      onPress={() => handleSimulateAppLaunch(app, app.schedule)}
                      style={[styles.simAppChip, active && styles.simAppChipActive]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.simAppDot, active && styles.simAppDotActive]} />
                      <Text style={[styles.simAppText, active && styles.simAppTextActive]}>
                        {app.appName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Schedules</Text>
          <Text style={styles.sectionCount}>{schedules.length}</Text>
        </Animated.View>

        {schedules.length === 0 ? renderEmpty() : (
          <View style={styles.schedulesList}>
            {schedules.map((s) => (
              <ScheduleCard
                key={s.id} schedule={s}
                isActiveOverride={activeSession && activeSession.enforcedScheduleId === s.id ? true : undefined}
                onToggle={() => {
                  if (activeSession && activeSession.enforcedScheduleId === s.id) {
                    Alert.alert(
                      'Schedule Locked! 🛡️',
                      `"${s.name}" is currently enforced by your active Focus Session and cannot be disabled until the session completes.`,
                      [{text: 'Got it'}]
                    );
                    return;
                  }
                  toggleSchedule(s.id);
                }}
                onDelete={() => {
                  if (activeSession && activeSession.enforcedScheduleId === s.id) {
                    Alert.alert(
                      'Schedule Locked! 🛡️',
                      `"${s.name}" is currently enforced by your active Focus Session and cannot be deleted until the session completes.`,
                      [{text: 'Got it'}]
                    );
                    return;
                  }
                  Alert.alert('Delete Schedule', `Delete "${s.name}"?`, [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Delete', style: 'destructive', onPress: () => deleteSchedule(s.id)},
                  ]);
                }}
                onEdit={() => {
                  if (activeSession && activeSession.enforcedScheduleId === s.id) {
                    Alert.alert(
                      'Schedule Locked! 🛡️',
                      `"${s.name}" is currently enforced by your active Focus Session and cannot be edited until the session completes.`,
                      [{text: 'Got it'}]
                    );
                    return;
                  }
                  navigation.navigate('Schedules', {scheduleId: s.id});
                }}
                onPreview={() => handlePreview(s)}
              />
            ))}
          </View>
        )}
        <View style={{height: 20}} />
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.fab}>
        <TouchableOpacity onPress={() => navigation.navigate('Schedules')} activeOpacity={0.85}>
          <LinearGradient colors={Colors.gradientPrimary} start={[0,0]} end={[1,0]} style={styles.fabInner}>
            <Plus color={Colors.text} size={28} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {paddingHorizontal: 24, paddingTop: 64, paddingBottom: 120},
  topBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24},
  appTitle: {fontSize: 28, fontWeight: '800', color: Colors.text},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2},
  liveIndicator: {width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success},
  statusText: {fontSize: 12, color: Colors.textSecondary, marginTop: 2},
  settingsBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A2236', alignItems: 'center', justifyContent: 'center'},
  nextBanner: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', marginBottom: 24},
  nextText: {fontSize: 12, color: Colors.textSecondary},
  nextTimeText: {fontWeight: '700', color: Colors.primaryLight},
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24},
  statCardWrapper: {flex: 1, minWidth: '46%'},
  statCard: {padding: 16, borderRadius: 16, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  statIconBox: {width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center'},
  statValue: {fontSize: 24, fontWeight: '800', color: Colors.text},
  statLabel: {fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: Colors.text},
  sectionCount: {fontSize: 12, fontWeight: '600', color: Colors.primary, backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999},
  schedulesList: {gap: 16},
  scheduleCard: {backgroundColor: '#141B2D', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)'},
  scheduleCardActive: {borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.05)'},
  activePill: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10},
  activeDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success},
  activePillText: {fontSize: 10, color: Colors.success, fontWeight: '600'},
  scheduleHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  scheduleInfo: {flex: 1},
  scheduleName: {fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4},
  scheduleTime: {fontSize: 12, color: Colors.primaryLight, fontWeight: '600', marginBottom: 2},
  scheduleDays: {fontSize: 10, color: Colors.textMuted},
  scheduleFooter: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12},
  appsChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1},
  appChip: {backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999},
  appChipText: {fontSize: 10, color: Colors.primaryLight, fontWeight: '500'},
  footerActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  previewBtn: {backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999},
  previewBtnText: {fontSize: 10, color: Colors.primaryLight, fontWeight: '600'},
  deleteBtn: {padding: 4},
  emptyState: {alignItems: 'center', paddingVertical: 48, gap: 16},
  emptyIcon: {width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)'},
  emptyTitle: {fontSize: 20, fontWeight: '700', color: Colors.text},
  emptySubtitle: {fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 24},
  emptyButton: {marginTop: 8, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999, elevation: 8, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 12},
  emptyButtonText: {color: Colors.text, fontSize: 14, fontWeight: '700'},
  fab: {position: 'absolute', right: 24, bottom: 36},
  fabInner: {width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 12, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.5, shadowRadius: 16},
  
  simBox: {marginBottom: 24},
  simContainer: {padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', overflow: 'hidden'},
  simHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  simTitle: {fontSize: 14, fontWeight: '800', color: Colors.text},
  simSubtitle: {fontSize: 10, color: Colors.textSecondary, lineHeight: 15, marginBottom: 12},
  simAppsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  simAppChip: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'},
  simAppChipActive: {backgroundColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)'},
  simAppDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted},
  simAppDotActive: {backgroundColor: '#A855F7'},
  simAppText: {fontSize: 11, fontWeight: '600', color: Colors.textSecondary},
  simAppTextActive: {color: '#E9D5FF'},
});

export default DashboardScreen;
