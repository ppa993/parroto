// Tiny synthesized sound-effects engine (Web Audio API) — no audio files needed.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = true;

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Call from a user gesture so audio is allowed (Safari / Chrome autoplay policies). */
export function unlockAudio() {
  const c = getCtx();
  if (!c || !master) return;
  try {
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(master);
    src.start(0);
  } catch {
    /* ignore */
  }
}

function getNoise(c: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function tone(freq: number, endFreq: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
  if (!enabled) return;
  const c = getCtx();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function noise(dur: number, vol: number, fromHz: number, toHz: number, delay = 0) {
  if (!enabled) return;
  const c = getCtx();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(fromHz, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(30, toHz), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + dur + 0.03);
}

export const sfx = {
  shoot() {
    tone(1400, 320, 0.08, 'square', 0.035);
  },
  error() {
    tone(150, 90, 0.14, 'sawtooth', 0.06);
  },
  explode() {
    noise(0.32, 0.22, 2600, 140);
    tone(200, 50, 0.22, 'triangle', 0.16);
    tone(880, 1320, 0.12, 'sine', 0.05, 0.02);
  },
  hurt() {
    noise(0.55, 0.4, 1200, 60);
    tone(320, 50, 0.5, 'sawtooth', 0.12);
  },
  countdown(go = false) {
    tone(go ? 880 : 440, go ? 880 : 440, go ? 0.25 : 0.12, 'sine', 0.12);
  },
  stageClear() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.2, 'triangle', 0.13, i * 0.1));
  },
  victory() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.25, 'triangle', 0.13, i * 0.12));
  },
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.97, 0.32, 'triangle', 0.14, i * 0.18));
  },
  click() {
    tone(900, 700, 0.05, 'sine', 0.05);
  },
};
