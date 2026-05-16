import {BlockSchedule, AppInfo, DayOfWeek} from '../store/useScheduleStore';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function isScheduleActive(schedule: BlockSchedule): boolean {
  if (!schedule.isEnabled) return false;
  const now = new Date();
  const currentDay = now.getDay() as DayOfWeek;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (!schedule.days.includes(currentDay)) return false;
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  if (startMinutes > endMinutes) return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function generateId(): string {
  return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getDaysLabel(days: DayOfWeek[]): string {
  if (days.length === 7) return 'Every day';
  if (days.length === 0) return 'No days selected';
  const weekdays: DayOfWeek[] = [1, 2, 3, 4, 5];
  const weekend: DayOfWeek[] = [0, 6];
  if (weekdays.every(d => days.includes(d)) && days.length === 5) return 'Weekdays';
  if (weekend.every(d => days.includes(d)) && days.length === 2) return 'Weekends';
  return days.map(d => DAY_LABELS[d]).join(', ');
}

export const DEMO_APPS: AppInfo[] = [
  { packageName: 'com.instagram.android', appName: 'Instagram' },
  { packageName: 'com.facebook.katana', appName: 'Facebook' },
  { packageName: 'com.twitter.android', appName: 'Twitter / X' },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok' },
  { packageName: 'com.youtube.android', appName: 'YouTube' },
  { packageName: 'com.reddit.frontpage', appName: 'Reddit' },
  { packageName: 'com.linkedin.android', appName: 'LinkedIn' },
  { packageName: 'com.whatsapp', appName: 'WhatsApp' },
  { packageName: 'org.telegram.messenger', appName: 'Telegram' },
  { packageName: 'com.discord', appName: 'Discord' },
  { packageName: 'com.snapchat.android', appName: 'Snapchat' },
  { packageName: 'com.pinterest', appName: 'Pinterest' },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix' },
  { packageName: 'com.spotify.music', appName: 'Spotify' },
  { packageName: 'com.google.android.youtube', appName: 'YouTube Music' },
];
