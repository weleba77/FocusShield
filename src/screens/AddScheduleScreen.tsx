import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert} from 'react-native';
import Animated, {FadeInUp, FadeInDown} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {ArrowLeft, Clock, Calendar, Smartphone, Check} from 'lucide-react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useScheduleStore, DayOfWeek, BlockSchedule} from '../store/useScheduleStore';
import {generateId, DAY_LABELS} from '../utils/scheduleUtils';
import {Colors, Spacing, BorderRadius, Typography} from '../utils/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AddSchedule'>;
  route: RouteProp<RootStackParamList, 'AddSchedule'>;
};

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

const TimePicker: React.FC<{label: string; value: string; onChange: (v: string) => void}> = ({label, value, onChange}) => {
  const [h, m] = value.split(':').map(Number);
  const isAm = h < 12;
  const hour12 = h % 12 || 12;

  const setHour = (delta: number) => {
    const newH = (h + delta + 24) % 24;
    onChange(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };
  const setMinute = (delta: number) => {
    const newM = (m + delta + 60) % 60;
    onChange(`${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };
  const toggleAmPm = () => {
    const newH = isAm ? h + 12 : h - 12;
    onChange(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  return (
    <View style={styles.timePickerContainer}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <View style={styles.timePicker}>
        <View style={styles.timeCol}>
          <TouchableOpacity onPress={() => setHour(1)} style={styles.timeArrow}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
          <View style={styles.timeBox}><Text style={styles.timeDigit}>{String(hour12).padStart(2, '0')}</Text></View>
          <TouchableOpacity onPress={() => setHour(-1)} style={styles.timeArrow}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.timeCol}>
          <TouchableOpacity onPress={() => setMinute(5)} style={styles.timeArrow}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
          <View style={styles.timeBox}><Text style={styles.timeDigit}>{String(m).padStart(2, '0')}</Text></View>
          <TouchableOpacity onPress={() => setMinute(-5)} style={styles.timeArrow}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={toggleAmPm} style={styles.ampm}>
          <Text style={styles.ampmText}>{isAm ? 'AM' : 'PM'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AddScheduleScreen: React.FC<Props> = ({navigation, route}) => {
  const {schedules, addSchedule, updateSchedule} = useScheduleStore();
  const editingId = route.params?.scheduleId;
  const editing = editingId ? schedules.find(s => s.id === editingId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [startTime, setStartTime] = useState(editing?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(editing?.endTime ?? '17:00');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(editing?.days ?? [1, 2, 3, 4, 5]);
  const [blockedApps] = useState(editing?.blockedApps ?? []);

  const toggleDay = (day: DayOfWeek) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const isOvernight = () => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return sh * 60 + sm > eh * 60 + em;
  };

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Name Required', 'Please enter a schedule name.');
    if (selectedDays.length === 0) return Alert.alert('Days Required', 'Please select at least one day.');
    if (blockedApps.length === 0) return Alert.alert('Apps Required', 'Please select apps to block first.');

    const schedule: BlockSchedule = {
      id: editingId ?? generateId(), name: name.trim(),
      startTime, endTime, days: selectedDays, blockedApps,
      isEnabled: editing?.isEnabled ?? true, createdAt: editing?.createdAt ?? Date.now(),
    };
    if (editingId) updateSchedule(editingId, schedule);
    else addSchedule(schedule);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#050810', '#0A0E1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View entering={FadeInDown.springify()} style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{editingId ? 'Edit Schedule' : 'New Schedule'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveIconBtn}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.saveGrad}>
            <Check color={Colors.text} size={20} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>Schedule Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input} value={name} onChangeText={setName}
              placeholder="e.g. Work Focus Block" placeholderTextColor={Colors.textMuted} maxLength={40}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Clock color={Colors.primaryLight} size={16} />
            <Text style={styles.sectionLabel}>Block Time</Text>
          </View>
          <View style={styles.timeRow}>
            <TimePicker label="Start" value={startTime} onChange={setStartTime} />
            <Text style={styles.toArrow}>→</Text>
            <TimePicker label="End" value={endTime} onChange={setEndTime} />
          </View>
          {isOvernight() && (
            <View style={styles.overnightBadge}>
              <Text style={styles.overnightText}>🌙 Overnight schedule detected</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Calendar color={Colors.primaryLight} size={16} />
            <Text style={styles.sectionLabel}>Repeat On</Text>
          </View>
          <View style={styles.daysRow}>
            {ALL_DAYS.map(day => {
              const sel = selectedDays.includes(day);
              return (
                <TouchableOpacity key={day} onPress={() => toggleDay(day)} style={[styles.dayBtn, sel && styles.dayBtnActive]}>
                  {sel ? (
                    <LinearGradient colors={Colors.gradientPrimary} style={styles.dayGrad}>
                      <Text style={[styles.dayText, styles.dayTextActive]}>{DAY_LABELS[day]}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.dayText}>{DAY_LABELS[day]}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.quickDays}>
            {[
              {label: 'Weekdays', days: [1,2,3,4,5] as DayOfWeek[]},
              {label: 'Weekend', days: [0,6] as DayOfWeek[]},
              {label: 'Every Day', days: ALL_DAYS},
            ].map(q => (
              <TouchableOpacity key={q.label} style={styles.quickBtn} onPress={() => setSelectedDays(q.days)}>
                <Text style={styles.quickText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Smartphone color={Colors.primaryLight} size={16} />
            <Text style={styles.sectionLabel}>Blocked Apps</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (!editingId) {
                Alert.alert('Save First', 'Please save the schedule first, then tap it to add apps.');
              } else {
                navigation.navigate('AppSelection', {scheduleId: editingId});
              }
            }}
            activeOpacity={0.85}>
            <LinearGradient colors={['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.06)']} style={styles.appsCard}>
              {blockedApps.length === 0 ? (
                <Text style={styles.addAppsText}>+ Tap to select apps to block</Text>
              ) : (
                <View style={styles.selectedApps}>
                  {blockedApps.map(app => (
                    <View key={app.packageName} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText} numberOfLines={1}>{app.appName}</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomSave}>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradientPrimary} start={[0,0]} end={[1,0]} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{editingId ? 'Save Changes' : 'Create Schedule'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16},
  backBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A2236', alignItems: 'center', justifyContent: 'center'},
  pageTitle: {fontSize: 18, fontWeight: '700', color: Colors.text},
  saveIconBtn: {},
  saveGrad: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  scroll: {paddingHorizontal: 24, paddingBottom: 60, gap: 16},
  section: {backgroundColor: '#141B2D', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)', gap: 16},
  sectionLabel: {fontSize: 14, fontWeight: '700', color: Colors.text},
  sectionLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  inputWrapper: {backgroundColor: '#1A2236', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)'},
  input: {color: Colors.text, fontSize: 16, padding: 16},
  timeRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  timePickerContainer: {flex: 1, alignItems: 'center', gap: 8},
  timePickerLabel: {fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1},
  timePicker: {flexDirection: 'row', alignItems: 'center', gap: 6},
  timeCol: {alignItems: 'center', gap: 4},
  timeArrow: {padding: 6},
  arrowText: {color: Colors.primary, fontSize: 14, fontWeight: '700'},
  timeBox: {backgroundColor: '#1A2236', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', minWidth: 54, alignItems: 'center'},
  timeDigit: {fontSize: 20, fontWeight: '700', color: Colors.text},
  timeSep: {fontSize: 20, fontWeight: '700', color: Colors.textMuted, marginBottom: 14},
  toArrow: {fontSize: 20, color: Colors.textMuted, fontWeight: '700'},
  ampm: {backgroundColor: '#1A2236', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)'},
  ampmText: {color: Colors.primaryLight, fontWeight: '700', fontSize: 12},
  overnightBadge: {backgroundColor: 'rgba(168,85,247,0.1)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)'},
  overnightText: {color: '#C084FC', fontSize: 12, fontWeight: '500'},
  daysRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 4},
  dayBtn: {flex: 1, aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A2236', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden'},
  dayBtnActive: {borderColor: 'transparent'},
  dayGrad: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'},
  dayText: {fontSize: 10, color: Colors.textSecondary, fontWeight: '600'},
  dayTextActive: {color: Colors.text},
  quickDays: {flexDirection: 'row', gap: 8},
  quickBtn: {flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1A2236', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  quickText: {fontSize: 10, color: Colors.primary, fontWeight: '600'},
  appsCard: {borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', minHeight: 64, alignItems: 'center', justifyContent: 'center'},
  addAppsText: {color: Colors.primary, fontSize: 14, fontWeight: '600'},
  selectedApps: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%'},
  selectedChip: {backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999},
  selectedChipText: {color: Colors.primaryLight, fontSize: 10, fontWeight: '600'},
  bottomSave: {marginTop: 8},
  saveButton: {paddingVertical: 18, borderRadius: 999, alignItems: 'center', elevation: 8, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 12},
  saveButtonText: {color: Colors.text, fontSize: 18, fontWeight: '700'},
});

export default AddScheduleScreen;
