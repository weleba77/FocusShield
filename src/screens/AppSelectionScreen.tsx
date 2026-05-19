import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, NativeModules, Platform, ActivityIndicator} from 'react-native';

const { FocusShieldModule } = NativeModules;
import Animated, {FadeInUp, FadeInDown, Layout} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {ArrowLeft, Search, Check, X} from 'lucide-react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useScheduleStore, AppInfo} from '../store/useScheduleStore';
import {DEMO_APPS} from '../utils/scheduleUtils';
import {Colors, Spacing, Typography, BorderRadius} from '../utils/theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AppSelection'>;
  route: RouteProp<RootStackParamList, 'AppSelection'>;
};

const AppRow: React.FC<{app: AppInfo; isSelected: boolean; onToggle: () => void; index: number}> = ({app, isSelected, onToggle, index}) => (
  <Animated.View layout={Layout.springify()} entering={FadeInUp.delay(index * 40).springify()}>
    <TouchableOpacity style={[styles.appRow, isSelected && styles.appRowSelected]} onPress={onToggle} activeOpacity={0.8}>
      <View style={[styles.appIcon, isSelected && styles.appIconSelected]}>
        <Text style={styles.appLetter}>{app.appName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{app.appName}</Text>
        <Text style={styles.appPkg} numberOfLines={1}>{app.packageName}</Text>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
        {isSelected && <Check color={Colors.text} size={14} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  </Animated.View>
);

const AppSelectionScreen: React.FC<Props> = ({navigation, route}) => {
  const {schedules, updateSchedule, activeSession} = useScheduleStore();
  const {scheduleId} = route.params;
  const schedule = schedules.find(s => s.id === scheduleId);

  const [allApps, setAllApps] = useState<AppInfo[]>(DEMO_APPS);
  const [filtered, setFiltered] = useState<AppInfo[]>(DEMO_APPS);
  const [selected, setSelected] = useState<AppInfo[]>(schedule?.blockedApps ?? []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInstalledApps = async () => {
      if (Platform.OS === 'android' && FocusShieldModule && FocusShieldModule.getInstalledApps) {
        try {
          setLoading(true);
          const apps: AppInfo[] = await FocusShieldModule.getInstalledApps();
          // Sort apps alphabetically
          const sortedApps = apps.sort((a, b) => a.appName.localeCompare(b.appName));
          setAllApps(sortedApps);
          setFiltered(sortedApps);
        } catch (e) {
          console.warn("Failed to fetch installed apps natively, falling back to demo list", e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchInstalledApps();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(allApps.filter(a => a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q)));
  }, [search, allApps]);

  const toggleApp = useCallback((app: AppInfo) => {
    setSelected(prev => prev.some(a => a.packageName === app.packageName) ? prev.filter(a => a.packageName !== app.packageName) : [...prev, app]);
  }, []);

  const isSelected = (app: AppInfo) => selected.some(a => a.packageName === app.packageName);

  const handleDone = () => {
    if (scheduleId && activeSession && activeSession.enforcedScheduleId === scheduleId) {
      Alert.alert(
        'Selection Locked! 🛡️',
        'This schedule is currently active or enforced by Focus Shield Mode. You cannot change its apps.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
      return;
    }
    if (schedule) updateSchedule(scheduleId, {blockedApps: selected});
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#050810', '#0A0E1A']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View entering={FadeInDown.springify()} style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Select Apps</Text>
          {selected.length > 0 && (
            <View style={styles.countBadge}><Text style={styles.countText}>{selected.length}</Text></View>
          )}
        </View>
        <TouchableOpacity onPress={handleDone} style={styles.doneBtn}>
          <LinearGradient colors={Colors.gradientPrimary} style={styles.doneBtnGrad}>
            <Text style={styles.doneBtnText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchBar}>
        <Search color={Colors.textMuted} size={18} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search apps..." placeholderTextColor={Colors.textMuted} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><X color={Colors.textMuted} size={18} /></TouchableOpacity>}
      </Animated.View>

      {selected.length > 0 && (
        <FlatList
          data={selected}
          keyExtractor={i => i.packageName}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsRow}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.chip} onPress={() => toggleApp(item)}>
              <Text style={styles.chipText}>{item.appName}</Text>
              <X color={Colors.primaryLight} size={12} />
            </TouchableOpacity>
          )}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Reading installed apps...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.packageName}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({item, index}) => (
            <AppRow app={item} isSelected={isSelected(item)} onToggle={() => toggleApp(item)} index={index} />
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No apps found</Text></View>}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, gap: 8},
  backBtn: {width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A2236', alignItems: 'center', justifyContent: 'center'},
  titleRow: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8},
  title: {fontSize: 18, fontWeight: '700', color: Colors.text},
  countBadge: {backgroundColor: Colors.primary, borderRadius: 999, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6},
  countText: {fontSize: 10, color: Colors.text, fontWeight: '700'},
  doneBtn: {},
  doneBtnGrad: {paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999},
  doneBtnText: {color: Colors.text, fontWeight: '700', fontSize: 12},
  searchBar: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 8, backgroundColor: '#1A2236', borderRadius: 12, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', gap: 8},
  searchInput: {flex: 1, color: Colors.text, fontSize: 14},
  chipsRow: {height: 52},
  chips: {paddingHorizontal: 24, alignItems: 'center', gap: 8},
  chip: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)'},
  chipText: {fontSize: 12, color: Colors.primaryLight, fontWeight: '600'},
  list: {paddingHorizontal: 24, paddingBottom: 32, gap: 8, paddingTop: 8},
  appRow: {flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#141B2D', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)'},
  appRowSelected: {borderColor: 'rgba(99,102,241,0.5)', backgroundColor: 'rgba(99,102,241,0.07)'},
  appIcon: {width: 48, height: 48, borderRadius: 12, backgroundColor: '#1A2236', alignItems: 'center', justifyContent: 'center'},
  appIconSelected: {backgroundColor: 'rgba(99,102,241,0.2)'},
  appLetter: {fontSize: 18, fontWeight: '700', color: Colors.primaryLight},
  appInfo: {flex: 1},
  appName: {fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2},
  appPkg: {fontSize: 10, color: Colors.textMuted},
  checkbox: {width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center'},
  checkboxActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  empty: {paddingVertical: 48, alignItems: 'center'},
  emptyText: {color: Colors.textMuted, fontSize: 14},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16},
  loadingText: {color: Colors.textMuted, fontSize: 14, fontWeight: '500'},
});

export default AppSelectionScreen;
