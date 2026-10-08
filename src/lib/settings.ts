import type { Accent } from './speech';

export type KeyboardMode = 'auto' | 'on' | 'off';

export type Settings = {
  tts: boolean; // read the shot word aloud
  accent: Accent;
  voiceURI: string; // '' = auto
  rate: number;
  showVi: boolean; // Vietnamese meaning bursts out of exploded words
  hints: boolean; // show Vietnamese under falling words
  sfx: boolean;
  keyboard: KeyboardMode; // on-screen keyboard
  lang: 'en' | 'ja'; // learning language
  showKana: boolean; // show kana reading above kanji (Japanese)
};

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  showKana: true,
  tts: true,
  accent: 'en-US',
  voiceURI: '',
  rate: 0.95,
  showVi: true,
  hints: false,
  sfx: true,
  keyboard: 'auto',
};

const KEY = 'parroto-settings-v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// Phones / tablets: primary pointer is a finger and there is no hover (excludes touchscreen laptops)
export const isTouchDevice =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches &&
  window.matchMedia('(hover: none)').matches;

export function keyboardVisible(mode: KeyboardMode) {
  return mode === 'on' || (mode === 'auto' && isTouchDevice);
}
