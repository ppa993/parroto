import { useEffect, useState } from 'react';

export type Accent = 'en-US' | 'en-GB';

export type SpeakOptions = {
  accent: Accent;
  rate: number;
  voiceURI?: string;
  volume?: number;
  lang?: 'en' | 'ja';
};

const synth: SpeechSynthesis | null =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

export const ttsSupported = !!synth && typeof SpeechSynthesisUtterance !== 'undefined';

let voices: SpeechSynthesisVoice[] = [];
let pendingTimer: number | undefined;
let unlocked = false;

function refreshVoices() {
  if (!synth) return;
  try {
    voices = synth.getVoices();
  } catch {
    voices = [];
  }
}

if (synth) {
  refreshVoices();
  try {
    synth.addEventListener('voiceschanged', refreshVoices);
  } catch {
    /* older browsers */
  }
}

const norm = (lang: string) => lang.replace('_', '-').toLowerCase();

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (!voices.length) refreshVoices();
  return voices.filter((v) => norm(v.lang).startsWith('en'));
}

function voiceScore(v: SpeechSynthesisVoice) {
  let s = 0;
  if (/natural|neural|enhanced|premium/i.test(v.name)) s += 5;
  if (/google/i.test(v.name)) s += 3;
  if (/samantha|aria|jenny|guy|libby|sonia|ryan|daniel|karen|serena|ava|allison|zira/i.test(v.name)) s += 2;
  if (v.default) s += 1;
  if (/novelty|whisper|bad news|bells|boing|bubbles|cellos|jester|organ|trinoids|zarvox|albert|fred|junior|ralph/i.test(v.name))
    s -= 10;
  return s;
}

export function pickVoice(accent: Accent, voiceURI?: string): SpeechSynthesisVoice | null {
  const english = getEnglishVoices();
  if (voiceURI) {
    const chosen = english.find((v) => v.voiceURI === voiceURI);
    if (chosen) return chosen;
  }
  const exact = english.filter((v) => norm(v.lang) === accent.toLowerCase());
  const pool = exact.length ? exact : english;
  if (!pool.length) return null;
  return [...pool].sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}

export function getJapaneseVoices(): SpeechSynthesisVoice[] {
  if (!voices.length) refreshVoices();
  return voices.filter((v) => norm(v.lang).startsWith('ja'));
}

export function pickJapaneseVoice(): SpeechSynthesisVoice | null {
  const ja = getJapaneseVoices();
  if (!ja.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|enhanced|premium|online/i.test(v.name) ? 5 : 0) +
    (/google|kyoko|nanami|haruka|o-ren|otoya/i.test(v.name) ? 3 : 0);
  return [...ja].sort((a, b) => score(b) - score(a))[0];
}

export const hasJapaneseVoice = () => getJapaneseVoices().length > 0;

function buildUtterance(text: string, opts: SpeakOptions) {
  const u = new SpeechSynthesisUtterance(text);
  const ja = opts.lang === 'ja';
  const v = ja ? pickJapaneseVoice() : pickVoice(opts.accent, opts.voiceURI);
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = ja ? 'ja-JP' : opts.accent;
  }
  u.rate = opts.rate;
  u.pitch = 1;
  u.volume = opts.volume ?? 1;
  return u;
}

/**
 * Speak an English word immediately. If something is still being spoken we cancel it
 * so the voice always matches the word that just exploded (no laggy queue).
 */
export function speak(text: string, opts: SpeakOptions) {
  if (!ttsSupported || !synth) return;
  try {
    const u = buildUtterance(text, opts);
    window.clearTimeout(pendingTimer);
    if (synth.speaking || synth.pending) {
      synth.cancel();
      // Chrome occasionally drops a speak() issued in the same tick as cancel()
      pendingTimer = window.setTimeout(() => synth.speak(u), 50);
    } else {
      if (synth.paused) synth.resume();
      synth.speak(u);
    }
  } catch {
    /* ignore speech errors */
  }
}

/** Must be called from a user gesture (click / keydown) — unlocks speech on iOS Safari. */
export function unlockSpeech() {
  if (!ttsSupported || !synth || unlocked) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeech() {
  if (!synth) return;
  window.clearTimeout(pendingTimer);
  try {
    synth.cancel();
  } catch {
    /* ignore */
  }
}

/** React hook: list of English voices, updates when the browser finishes loading them. */
export function useEnglishVoices() {
  const [list, setList] = useState<SpeechSynthesisVoice[]>(() => getEnglishVoices());
  useEffect(() => {
    if (!synth) return;
    const update = () => {
      refreshVoices();
      setList(getEnglishVoices());
    };
    try {
      synth.addEventListener('voiceschanged', update);
    } catch {
      /* ignore */
    }
    const t1 = window.setTimeout(update, 300);
    const t2 = window.setTimeout(update, 1500);
    return () => {
      try {
        synth.removeEventListener('voiceschanged', update);
      } catch {
        /* ignore */
      }
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  return list;
}
