import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  Clock,
  RotateCcw,
  Info,
  Camera,
  Video,
  MessageSquare,
  Plus,
  Save,
  X as XIcon,
} from 'lucide-react-native';
import { useScheduleStore, BlockSchedule, DayOfWeek } from '../store/useScheduleStore';
import { generateId } from '../utils/scheduleUtils';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parse24to12(time24: string) {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr || '0', 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return {
    hours: String(h).padStart(2, '0'),
    minutes: m.padStart(2, '0'),
    period
  };
}

function convert12to24(hours: string, minutes: string, period: string): string {
  let h = parseInt(hours || '12', 10);
  if (isNaN(h) || h < 1 || h > 12) h = 12;
  let m = parseInt(minutes || '00', 10);
  if (isNaN(m) || m < 0 || m > 59) m = 0;
  
  if (period === 'PM' && h < 12) {
    h += 12;
  } else if (period === 'AM' && h === 12) {
    h = 0;
  }
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function SchedulesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { schedules, addSchedule, updateSchedule, activeSession } = useScheduleStore();
  const editingId = route.params?.scheduleId;
  const editing = editingId ? schedules.find((s) => s.id === editingId) : undefined;

  useEffect(() => {
    if (editingId && activeSession && activeSession.enforcedScheduleId === editingId) {
      Alert.alert(
        'Schedule Locked! 🛡️',
        'This schedule is currently active or enforced by Focus Shield Mode. You cannot edit it.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    }
  }, [editingId, activeSession, navigation]);

  const [name, setName] = useState(editing?.name ?? 'My Focus Block');
  
  const initialStart = parse24to12(editing?.startTime ?? '22:00');
  const [startH, setStartH] = useState(initialStart.hours);
  const [startM, setStartM] = useState(initialStart.minutes);
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>(initialStart.period as 'AM' | 'PM');

  const initialEnd = parse24to12(editing?.endTime ?? '06:00');
  const [endH, setEndH] = useState(initialEnd.hours);
  const [endM, setEndM] = useState(initialEnd.minutes);
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>(initialEnd.period as 'AM' | 'PM');

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(editing?.days ?? [1, 2, 3, 4, 5]);

  // Update state if editing changes (e.g., coming back from another tab)
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSelectedDays(editing.days);
      const s12 = parse24to12(editing.startTime);
      setStartH(s12.hours);
      setStartM(s12.minutes);
      setStartPeriod(s12.period as 'AM' | 'PM');

      const e12 = parse24to12(editing.endTime);
      setEndH(e12.hours);
      setEndM(e12.minutes);
      setEndPeriod(e12.period as 'AM' | 'PM');
    } else {
      setName('My Focus Block');
      setSelectedDays([1, 2, 3, 4, 5]);
      setStartH('10');
      setStartM('00');
      setStartPeriod('PM');
      
      setEndH('06');
      setEndM('00');
      setEndPeriod('AM');
    }
  }, [editingId, editing]);

  const blockedApps = editing?.blockedApps ?? [];

  const toggleDay = (index: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const isOvernight = () => {
    const startTime24 = convert12to24(startH, startM, startPeriod);
    const endTime24 = convert12to24(endH, endM, endPeriod);
    const [sh, sm] = startTime24.split(':').map(Number);
    const [eh, em] = endTime24.split(':').map(Number);
    return sh * 60 + (sm || 0) > eh * 60 + (em || 0);
  };

  const handleSave = () => {
    if (editingId && activeSession && activeSession.enforcedScheduleId === editingId) {
      Alert.alert(
        'Save Blocked! 🛡️',
        'This schedule is currently active or enforced by Focus Shield Mode. You cannot save changes to it.',
        [{ text: 'Got it' }]
      );
      return;
    }
    if (!name.trim()) return Alert.alert('Name Required', 'Please enter a schedule name.');
    if (selectedDays.length === 0) return Alert.alert('Days Required', 'Please select at least one day.');

    // Validate times are filled
    if (!startH || !startM || !endH || !endM) {
      return Alert.alert('Time Required', 'Please complete the Start and End times.');
    }

    const startTime24 = convert12to24(startH, startM, startPeriod);
    const endTime24 = convert12to24(endH, endM, endPeriod);

    const schedule: BlockSchedule = {
      id: editingId ?? generateId(),
      name: name.trim(),
      startTime: startTime24,
      endTime: endTime24,
      days: selectedDays,
      blockedApps: blockedApps,
      isEnabled: editing?.isEnabled ?? true,
      createdAt: editing?.createdAt ?? Date.now(),
    };

    if (editingId) {
      updateSchedule(editingId, schedule);
    } else {
      addSchedule(schedule);
    }
    
    // Clear params to reset to create mode for next time
    navigation.setParams({ scheduleId: undefined });
    navigation.navigate('Dashboard');
  };

  const handleSelectApps = () => {
    if (editingId && activeSession && activeSession.enforcedScheduleId === editingId) {
      Alert.alert(
        'Selection Blocked! 🛡️',
        'This schedule is currently active or enforced by Focus Shield Mode. You cannot change its apps.',
        [{ text: 'Got it' }]
      );
      return;
    }
    if (!editingId) {
      Alert.alert(
        'Save First',
        'Please save the schedule first, then tap it from the Dashboard to add apps.'
      );
    } else {
      navigation.navigate('AppSelection', { scheduleId: editingId });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Shield color="#4ADE80" size={24} />
          <Text style={styles.headerTitle}>Focus Shield</Text>
        </View>
        <View style={styles.avatarPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <Text style={styles.screenTitle}>{editingId ? 'Edit Schedule' : 'Block Schedule'}</Text>
        <Text style={styles.screenSubtitle}>
          Configure your recurring focus windows to automatically restrict distractions.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.sectionLabel}>SCHEDULE NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Work Focus"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Time Selection */}
        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.sectionLabel}>START TIME</Text>
            <View style={styles.timeCard}>
              <View style={styles.timeInputRow}>
                <TextInput 
                  style={styles.timeInputText} 
                  value={startH} 
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    setStartH(clean);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="10"
                  placeholderTextColor="#777"
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput 
                  style={styles.timeInputText} 
                  value={startM} 
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    setStartM(clean);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#777"
                />
              </View>
              <View style={styles.periodToggle}>
                <TouchableOpacity 
                  onPress={() => setStartPeriod('AM')}
                  style={[styles.periodBtn, startPeriod === 'AM' && styles.periodBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodBtnText, startPeriod === 'AM' && styles.periodBtnTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setStartPeriod('PM')}
                  style={[styles.periodBtn, startPeriod === 'PM' && styles.periodBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodBtnText, startPeriod === 'PM' && styles.periodBtnTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.timeCol}>
            <Text style={styles.sectionLabel}>END TIME</Text>
            <View style={styles.timeCard}>
              <View style={styles.timeInputRow}>
                <TextInput 
                  style={styles.timeInputText} 
                  value={endH} 
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    setEndH(clean);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="06"
                  placeholderTextColor="#777"
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput 
                  style={styles.timeInputText} 
                  value={endM} 
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    setEndM(clean);
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#777"
                />
              </View>
              <View style={styles.periodToggle}>
                <TouchableOpacity 
                  onPress={() => setEndPeriod('AM')}
                  style={[styles.periodBtn, endPeriod === 'AM' && styles.periodBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodBtnText, endPeriod === 'AM' && styles.periodBtnTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setEndPeriod('PM')}
                  style={[styles.periodBtn, endPeriod === 'PM' && styles.periodBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodBtnText, endPeriod === 'PM' && styles.periodBtnTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Info Card */}
        {isOvernight() && (
          <View style={styles.infoCard}>
            <Info color="#4ADE80" size={20} />
            <Text style={styles.infoText}>
              This schedule runs overnight across two days.
            </Text>
          </View>
        )}

        {/* Repeat On */}
        <Text style={[styles.sectionLabel, { marginTop: 24, marginBottom: 12 }]}>
          REPEAT ON
        </Text>
        <View style={styles.daysContainer}>
          {DAYS.map((day, index) => {
            const isSelected = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[styles.dayText, isSelected && styles.dayTextSelected]}
                >
                  {DAY_LABELS[day]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Apps To Block */}
        <View style={styles.appsHeader}>
          <Text style={styles.sectionLabel}>APPS TO BLOCK</Text>
          <TouchableOpacity onPress={handleSelectApps}>
            <Text style={styles.selectAppsText}>Select Apps</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.appsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsScroll}>
            {blockedApps.length === 0 ? (
              <Text style={{color: '#A0A0A0', paddingVertical: 10}}>No apps selected.</Text>
            ) : (
              blockedApps.map((app) => (
                <View key={app.packageName} style={styles.appItemContainer}>
                  <View style={styles.appIconWrapper}>
                    <Text style={{color: '#fff', fontSize: 18}}>{app.appName.charAt(0)}</Text>
                  </View>
                  <Text style={styles.appName} numberOfLines={1}>{app.appName}</Text>
                </View>
              ))
            )}
            
            <View style={styles.appItemContainer}>
              <TouchableOpacity style={styles.addAppWrapper} onPress={handleSelectApps}>
                <Plus color="#8E8E93" size={24} />
              </TouchableOpacity>
              <Text style={styles.appName}>Add</Text>
            </View>
          </ScrollView>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save color="#121212" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Save Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#4ADE80',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
  },
  screenTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  screenSubtitle: {
    color: '#A0A0A0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeCol: {
    width: '48%',
  },
  sectionLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInputText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
    padding: 0,
  },
  timeSeparator: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: 1,
  },
  periodToggle: {
    flexDirection: 'column',
    gap: 3,
    backgroundColor: '#121212',
    padding: 3,
    borderRadius: 8,
  },
  periodBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#4ADE80',
  },
  periodBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
  },
  periodBtnTextActive: {
    color: '#121212',
  },
  infoCard: {
    backgroundColor: '#0F291E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#18402D',
  },
  infoText: {
    color: '#4ADE80',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  daysContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#121212',
    fontWeight: 'bold',
  },
  appsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAppsText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  appsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  appsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appItemContainer: {
    alignItems: 'center',
    marginRight: 24,
    maxWidth: 60,
  },
  appIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addAppWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3A3A3C',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
