import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated as RNAnimated,
  Easing,
  Vibration,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Play, Pause, RotateCcw, Brain, Shield, Award, AlertCircle, Lock} from 'lucide-react-native';
import {useScheduleStore} from '../store/useScheduleStore';
import {Colors, Spacing} from '../utils/theme';

export default function FocusScreen() {
  const {
    schedules,
    addFocusMinutes,
    incrementStreak,
    activeSession,
    startFocusSession,
    clearFocusSession,
  } = useScheduleStore();
  
  // Timer States
  const [selectedPreset, setSelectedPreset] = useState<number>(25); // in minutes
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // in seconds
  const [isActive, setIsActive] = useState<boolean>(false);
  const [enforcedScheduleId, setEnforcedScheduleId] = useState<string>('');
  const [completed, setCompleted] = useState<boolean>(false);

  // Animations
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const presets = [15, 25, 45, 60];

  // Apply visual pulsing when timer is active
  useEffect(() => {
    if (isActive) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          RNAnimated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      RNAnimated.timing(glowAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      pulseAnim.setValue(1);
      RNAnimated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive, pulseAnim, glowAnim]);

  // Session Completed
  const handleSessionComplete = () => {
    setIsActive(false);
    const minutesLogged = activeSession ? activeSession.durationMinutes : selectedPreset;
    addFocusMinutes(minutesLogged);
    incrementStreak();
    setCompleted(true);
    clearFocusSession();
    Vibration.vibrate([0, 500, 110, 500]); // Vibrate twice on completion
  };

  // Load persisted session on mount/focus
  useEffect(() => {
    if (activeSession) {
      const now = Date.now();
      if (now < activeSession.endTime) {
        const remaining = Math.ceil((activeSession.endTime - now) / 1000);
        setTimeLeft(remaining);
        setIsActive(true);
        setSelectedPreset(activeSession.durationMinutes);
        setEnforcedScheduleId(activeSession.enforcedScheduleId || '');
        setCompleted(false);
      } else {
        // Active session finished while app was closed
        handleSessionComplete();
      }
    }
  }, [activeSession]);

  // Main Timer Logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        if (activeSession) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((activeSession.endTime - now) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            handleSessionComplete();
          }
        } else {
          setTimeLeft((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              handleSessionComplete();
              return 0;
            }
            return next;
          });
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, activeSession]);

  // Handle Preset Change
  const handlePresetSelect = (minutes: number) => {
    if (isActive) return;
    setSelectedPreset(minutes);
    setTimeLeft(minutes * 60);
    setCompleted(false);
  };

  // Toggle Timer Play/Pause
  const toggleTimer = () => {
    if (isActive) {
      Alert.alert(
        'Focus Mode Enforced! 🛡️',
        'Strict Focus is active. You cannot pause, stop, or reset this session until the timeline completes.\n\nKeep focusing, you can do this!',
        [{ text: 'Stay Focused', style: 'default' }]
      );
      return;
    }

    if (completed) {
      setCompleted(false);
      setTimeLeft(selectedPreset * 60);
    }
    
    // Starting a new session
    startFocusSession(selectedPreset, enforcedScheduleId || null);
    setIsActive(true);
  };

  // Reset Timer
  const resetTimer = () => {
    if (isActive) {
      Alert.alert(
        'Reset Blocked! 🛡️',
        'You cannot reset the timer during an active strict focus session.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    setIsActive(false);
    setTimeLeft(selectedPreset * 60);
    setCompleted(false);
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentSchedule = schedules.find((s) => s.id === enforcedScheduleId);

  return (
    <LinearGradient colors={['#050810', '#0A0E1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Brain color={Colors.primaryLight} size={28} />
          <Text style={styles.headerTitle}>Focus Shield Mode</Text>
          <Text style={styles.headerSubtitle}>Mute distractions and enter deep work</Text>
        </View>

        {/* Focus Timer Circle Card */}
        <RNAnimated.View 
          style={[
            styles.timerCardWrapper,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <LinearGradient
            colors={isActive ? ['rgba(99,102,241,0.25)', 'rgba(168,85,247,0.12)'] : ['#141B2D', '#1A2236']}
            style={styles.timerCard}
          >
            {completed ? (
              <View style={styles.completeContainer}>
                <Award color={Colors.success} size={64} style={styles.awardIcon} />
                <Text style={styles.completeTitle}>Excellent Focus!</Text>
                <Text style={styles.completeText}>+{selectedPreset} Focus Minutes Logged</Text>
              </View>
            ) : (
              <>
                <Text style={styles.timerSubtitle}>
                  {isActive ? 'SHIELD PROTECTION ON' : 'READY TO FOCUS'}
                </Text>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerPresetText}>{selectedPreset}m Interval</Text>
              </>
            )}
          </LinearGradient>
        </RNAnimated.View>

        {/* Timer Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            onPress={resetTimer} 
            style={[styles.secondaryBtn, isActive && { opacity: 0.4 }]} 
            activeOpacity={isActive ? 1 : 0.75}
          >
            <RotateCcw color={Colors.textSecondary} size={22} />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleTimer} activeOpacity={0.85}>
            <LinearGradient
              colors={isActive ? ['#312E81', '#1E1B4B'] : Colors.gradientPrimary}
              start={[0, 0]} end={[1, 0]}
              style={[styles.primaryBtn, isActive && { borderColor: 'rgba(99,102,241,0.5)', borderWidth: 1 }]}
            >
              {isActive ? (
                <Lock color="#818CF8" size={24} />
              ) : (
                <Play color={Colors.text} size={24} fill={Colors.text} style={styles.playIcon} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Presets List */}
        {!isActive && (
          <View style={styles.presetSection}>
            <Text style={styles.sectionLabel}>Select Focus Duration</Text>
            <View style={styles.presetGrid}>
              {presets.map((p) => {
                const isSelected = selectedPreset === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => handlePresetSelect(p)}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipActive
                    ]}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={Colors.gradientPrimary}
                        start={[0, 0]} end={[1, 0]}
                        style={styles.presetChipGradient}
                      >
                        <Text style={styles.presetChipTextActive}>{p} Min</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={styles.presetChipText}>{p} Min</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Schedule Enforcer */}
        <View style={styles.enforcerSection}>
          <Text style={styles.sectionLabel}>Enforce Distraction Blocking</Text>
          <Text style={styles.enforcerSubtitle}>
            Pair this session with a schedule to strictly block designated apps.
          </Text>
          
          {schedules.length === 0 ? (
            <View style={styles.emptySchedulesBox}>
              <AlertCircle color={Colors.textMuted} size={18} />
              <Text style={styles.emptySchedulesText}>No schedules configured yet.</Text>
            </View>
          ) : (
            <View style={styles.schedulesChipsRow}>
              {schedules.map((s) => {
                const isEnforced = enforcedScheduleId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      if (isActive) {
                        Alert.alert(
                          'Schedule Locked! 🛡️',
                          'You cannot change the enforced schedule during an active focus session.',
                          [{ text: 'Got it', style: 'default' }]
                        );
                        return;
                      }
                      setEnforcedScheduleId(isEnforced ? '' : s.id);
                    }}
                    style={[
                      styles.scheduleChip,
                      isEnforced && styles.scheduleChipActive,
                      !s.isEnabled && styles.scheduleChipDisabled
                    ]}
                    activeOpacity={0.85}
                  >
                    <Shield color={isEnforced ? '#4ADE80' : Colors.textMuted} size={14} />
                    <Text 
                      style={[
                        styles.scheduleChipText,
                        isEnforced && styles.scheduleChipTextActive
                      ]}
                      numberOfLines={1}
                    >
                      {s.name} {!s.isEnabled && '(Disabled)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {currentSchedule && isActive && (
            <LinearGradient
              colors={['rgba(74,222,128,0.15)', 'rgba(74,222,128,0.04)']}
              style={styles.shieldStatusBox}
            >
              <Shield color="#4ADE80" size={18} />
              <View style={styles.shieldStatusContent}>
                <Text style={styles.shieldStatusTitle}>Active App Blocking Enabled</Text>
                <Text style={styles.shieldStatusDesc}>
                  Currently shielding distractions from {currentSchedule.blockedApps.length} apps.
                </Text>
              </View>
            </LinearGradient>
          )}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {paddingHorizontal: 24, paddingTop: 64, paddingBottom: 100},
  header: {alignItems: 'center', marginBottom: Spacing.xl, gap: 6},
  headerTitle: {fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 4},
  headerSubtitle: {fontSize: 12, color: Colors.textSecondary, textAlign: 'center'},
  
  timerCardWrapper: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  timerCard: {
    borderRadius: 160, // Make it a gorgeous large capsule circle card
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  timerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 2,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '900',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerPresetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },

  completeContainer: {alignItems: 'center', gap: Spacing.sm},
  awardIcon: {marginBottom: Spacing.xs},
  completeTitle: {fontSize: 20, fontWeight: '800', color: Colors.success},
  completeText: {fontSize: 12, color: Colors.textSecondary, fontWeight: '500'},

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: Spacing.xxl,
  },
  primaryBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E2640',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  playIcon: {marginLeft: 4},

  presetSection: {marginBottom: Spacing.xl},
  sectionLabel: {fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm},
  presetGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  presetChip: {
    flex: 1,
    minWidth: '22%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#141B2D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {borderColor: 'transparent'},
  presetChipGradient: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  presetChipText: {fontSize: 12, fontWeight: '600', color: Colors.textSecondary},
  presetChipTextActive: {fontSize: 12, fontWeight: '700', color: Colors.text},

  enforcerSection: {
    backgroundColor: '#141B2D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  enforcerSubtitle: {fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginBottom: Spacing.md},
  emptySchedulesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  emptySchedulesText: {fontSize: 12, color: Colors.textMuted},
  schedulesChipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  scheduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  scheduleChipActive: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  scheduleChipDisabled: {opacity: 0.6},
  scheduleChipText: {fontSize: 11, fontWeight: '600', color: Colors.textSecondary, maxWidth: 100},
  scheduleChipTextActive: {color: '#4ADE80'},

  shieldStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    marginTop: Spacing.md,
  },
  shieldStatusContent: {flex: 1, gap: 2},
  shieldStatusTitle: {fontSize: 12, fontWeight: '700', color: '#4ADE80'},
  shieldStatusDesc: {fontSize: 10, color: Colors.textSecondary},
});
