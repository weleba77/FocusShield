import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppInfo { packageName: string; appName: string }
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BlockSchedule {
  id: string; name: string; startTime: string; endTime: string;
  days: DayOfWeek[]; blockedApps: AppInfo[]; isEnabled: boolean; createdAt: number;
}

export interface FocusStats {
  totalBlockedAttempts: number; totalFocusMinutes: number;
  streak: number; lastUpdated: string;
}

interface ScheduleState {
  schedules: BlockSchedule[]; stats: FocusStats;
  hasOnboarded: boolean; hasPermissions: boolean;
  addSchedule: (s: BlockSchedule) => void;
  updateSchedule: (id: string, updates: Partial<BlockSchedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  setHasOnboarded: (v: boolean) => void;
  setHasPermissions: (v: boolean) => void;
  getNextBlockTime: () => string | null;
  incrementBlockedAttempts: () => void;
  addFocusMinutes: (minutes: number) => void;
  incrementStreak: () => void;
  resetStats: () => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],
      stats: { totalBlockedAttempts: 0, totalFocusMinutes: 0, streak: 3, lastUpdated: new Date().toDateString() },
      hasOnboarded: false,
      hasPermissions: false,

      addSchedule: (s) => set((state) => ({ schedules: [...state.schedules, s] })),
      updateSchedule: (id, updates) =>
        set((state) => ({ schedules: state.schedules.map((s) => s.id === id ? { ...s, ...updates } : s) })),
      deleteSchedule: (id) =>
        set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) })),
      toggleSchedule: (id) =>
        set((state) => ({ schedules: state.schedules.map((s) => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s) })),
      setHasOnboarded: (v) => set({ hasOnboarded: v }),
      setHasPermissions: (v) => set({ hasPermissions: v }),
      incrementBlockedAttempts: () => set((state) => ({
        stats: { ...state.stats, totalBlockedAttempts: state.stats.totalBlockedAttempts + 1 }
      })),
      addFocusMinutes: (minutes) => set((state) => ({
        stats: { ...state.stats, totalFocusMinutes: state.stats.totalFocusMinutes + minutes }
      })),
      incrementStreak: () => set((state) => ({
        stats: { ...state.stats, streak: state.stats.streak + 1 }
      })),
      resetStats: () => set({
        stats: { totalBlockedAttempts: 0, totalFocusMinutes: 0, streak: 0, lastUpdated: new Date().toDateString() }
      }),

      getNextBlockTime: () => {
        const { schedules } = get();
        const enabled = schedules.filter((s) => s.isEnabled);
        if (enabled.length === 0) return null;
        const now = new Date();
        const currentDay = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let nearest: { dayOffset: number; minutes: number } | null = null;
        for (const schedule of enabled) {
          const [h, m] = schedule.startTime.split(':').map(Number);
          const scheduleMinutes = h * 60 + m;
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const targetDay = ((currentDay + dayOffset) % 7) as DayOfWeek;
            if (!schedule.days.includes(targetDay)) continue;
            const isToday = dayOffset === 0;
            if (isToday && scheduleMinutes <= currentMinutes) continue;
            if (!nearest || dayOffset < nearest.dayOffset || (dayOffset === nearest.dayOffset && scheduleMinutes < nearest.minutes)) {
              nearest = { dayOffset, minutes: scheduleMinutes };
            }
            break;
          }
        }
        if (!nearest) return null;
        const h = Math.floor(nearest.minutes / 60);
        const m = nearest.minutes % 60;
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        const dayLabel = nearest.dayOffset === 0 ? 'Today' : nearest.dayOffset === 1 ? 'Tomorrow' : `In ${nearest.dayOffset} days`;
        return `${dayLabel} at ${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
      },
    }),
    { name: 'focus-shield-expo-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
