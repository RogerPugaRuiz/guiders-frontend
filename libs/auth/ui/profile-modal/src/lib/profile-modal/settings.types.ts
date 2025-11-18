// Tipos para el modal de configuraciones

import { SafeHtml } from '@angular/platform-browser';

export type UserStatus = 'online' | 'away' | 'busy' | 'invisible';
export type Theme = 'light' | 'dark' | 'auto';
export type FontSize = 'small' | 'medium' | 'large';
export type Language = 'es' | 'en';

export interface ProfileSettings {
  fullName: string;
  email: string; // readonly
  status: UserStatus;
  timezone: string;
  phone?: string;
  avatarUrl?: string;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  volume: number; // 0-100
  desktopNotifications: boolean;
  onlyMentions: boolean;
  dailyEmailSummary: boolean;
  urgentSoundEnabled: boolean;
}

export interface AppearanceSettings {
  theme: Theme;
  fontSize: FontSize;
  compactMode: boolean;
  showAvatars: boolean;
  language: Language;
}

export interface ChatPreferences {
  autoAssignChats: boolean;
  maxSimultaneousChats: number; // 1-10
  chatSignature: string;
  awayMessage: string;
  sendWithEnter: boolean;
  showTypingIndicator: boolean;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  shareLastActivity: boolean;
}

export interface AllSettings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  chat: ChatPreferences;
  privacy: PrivacySettings;
}

export type SettingsSection = 'profile' | 'notifications' | 'appearance' | 'chat' | 'privacy';

export interface SettingsSectionConfig {
  id: SettingsSection;
  label: string;
  svg: SafeHtml;
}

export interface AvatarUpdateRequest {
  userId: string;
  file: File;
}

export interface SettingsUpdateRequest {
  section: SettingsSection;
  settings: Partial<AllSettings[SettingsSection]>;
}
