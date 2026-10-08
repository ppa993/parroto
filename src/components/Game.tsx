import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { DECKS, STAGE_COUNT, buildStage, createGamePlan, getBest, setBest, type StageConfig, type WordEntry } from '../data/decks';
import { keyboardVisible, type Settings } from '../lib/settings';
import { sfx, setSfxEnabled } from '../lib/sfx';
import { renderScoreCard, shareScoreImage, type ScoreCardData } from '../lib/shareCard';
import { speak, stopSpeech } from '../lib/speech';
import {
  canStart,
  feed,
  isComplete,
  kanaToUnits,
  lettersToUnits,
  newTypeState,
  progressParts,
  unitsToRomaji,
  type TypeState,
  type Unit,
} from '../lib/kana';

const wordHalfWidth = (e: WordEntry, romaji: string) =>
  Math.max(romaji.length * 14, e.jp ? Array.from(e.jp).length * 28 : 0) / 2 + 20;
import SettingsPanel from './SettingsPanel';
import VirtualKeyboard from './VirtualKeyboard';

type FallingWord = {
  id: number;
  entry: WordEntry;
  text: string;
  x: number;
  y: number;
  speed: number;
  units: Unit[];
  st: TypeState;
  hit: number; // flash timer after a correct key
  shake: number; // wrong-key shake timer
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  char?: string;
};

type Laser = { id: number; x: number; y: number; life: number };
type FloatText = { id: number; x: number; y: number; text: string; life: number; color: string };
type Ring = { id: number; x: number; y: number; life: number; maxLife: number; color: string; size: number; flash?: boolean };
type MeaningBurst = {
  id: number;
  x: number;
  y: number;
  word: string;
  pos: string;
  vi: string;
  pts: number;
  combo: number;
  life: number;
  maxLife: number;
  seeds: number[];
};

type Phase = 'countdown' | 'playing' | 'stageClear' | 'over' | 'victory';
type ShareState = 'idle' | 'working' | 'shared' | 'downloaded' | 'failed';

const BASE_ZONE = 110; // px from bottom where words hit the base
const CHAR_W = 14;
const BURST_LIFE = 2.2;
const COLORS = ['#dfc995', '#b8d0bd', '#d8947e', '#c7ddd1', '#d4c09a', '#91b6a6'];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

let uid = 1;
const nextId = () => uid++;

type Engine = ReturnType<typeof createEngine>;

function createEngine(deckId: string, startStage: number) {
  const deck = DECKS.find((d) => d.id === deckId) ?? DECKS[0];
  const plan = createGamePlan(deck, startStage);
  return {
    deck,
    plan,
    stage: buildStage(deck, startStage, plan) as StageConfig,
    stageIndex: startStage,
    spawned: 0,
    spawnTimer: 0.4,
    words: [] as FallingWord[],
    particles: [] as Particle[],
    lasers: [] as Laser[],
    floats: [] as FloatText[],
    rings: [] as Ring[],
    bursts: [] as MeaningBurst[],
    lockedId: null as number | null,
    phase: 'countdown' as Phase,
    phaseTimer: 3,
    lastCount: 0,
    paused: false,
    dirty: true,
    score: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    keystrokes: 0,
    correct: 0,
    mistakes: 0,
    destroyed: 0,
    missed: 0,
    playTime: 0,
    learned: [] as WordEntry[],
    missedWords: [] as WordEntry[],
    shake: 0,
    hurt: 0,
    heartAnim: 0,
    width: 800,
    height: 600,
    shipAngle: 0,
    newBest: false,
  };
}

const calcAccuracy = (g: Engine) => (g.keystrokes ? Math.round((g.correct / g.keystrokes) * 100) : 100);
const calcWpm = (g: Engine) => (g.playTime > 3 ? Math.round(g.correct / 5 / (g.playTime / 60)) : 0);

function cardData(g: Engine): ScoreCardData {
  return {
    result: g.phase === 'victory' ? 'victory' : 'over',
    deckName: g.deck.name,
    deckIcon: g.deck.icon,
    level: g.deck.level,
    score: g.score,
    stage: g.stageIndex + 1,
    stageCount: STAGE_COUNT,
    destroyed: g.destroyed,
    missed: g.missed,
    maxCombo: g.maxCombo,
    accuracy: calcAccuracy(g),
    wpm: calcWpm(g),
    words: g.learned,
  };
}

type Props = {
  deckId: string;
  startStage: number;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onRestart: () => void;
  onMenu: () => void;
};

export default function Game({ deckId, startStage, settings, onSettingsChange, onRestart, onMenu }: Props) {
  const [g] = useState(() => createEngine(deckId, startStage));
  const fieldRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  const cardRef = useRef<{ blob: Blob | null }>({ blob: null });
  const [, setTick] = useState(0);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const t = window.setInterval(
      () => setClock(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
      30000
    );
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    setSfxEnabled(settings.sfx);
    g.dirty = true;
  }, [settings, g]);

  useEffect(() => () => stopSpeech(), []);

  // Track play-field size
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const update = () => {
      g.width = el.clientWidth;
      g.height = el.clientHeight;
      g.dirty = true;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [g]);

  const setPaused = useCallback(
    (v: boolean) => {
      if (g.phase === 'over' || g.phase === 'victory') return;
      g.paused = v;
      g.dirty = true;
    },
    [g]
  );

  const say = useCallback((entry: WordEntry) => {
    const s = settingsRef.current;
    if (entry.kana) speak(entry.kana, { accent: s.accent, rate: s.rate * 0.95, lang: 'ja' });
    else speak(entry.word, { accent: s.accent, rate: s.rate, voiceURI: s.voiceURI });
  }, []);

  const burst = useCallback(
    (x: number, y: number, n: number, color?: string, speed = 220) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.3 + Math.random());
        const life = 0.4 + Math.random() * 0.5;
        g.particles.push({
          id: nextId(),
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life,
          maxLife: life,
          color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 2 + Math.random() * 4,
        });
      }
    },
    [g]
  );

  const spawnWord = useCallback(() => {
    const entry = g.stage.queue[g.spawned];
    if (!entry) return;
    const units = entry.kana ? kanaToUnits(entry.kana) : lettersToUnits(entry.word);
    const romaji = unitsToRomaji(units);
    const half = wordHalfWidth(entry, romaji);
    const minX = half;
    const maxX = Math.max(minX + 1, g.width - half);
    let x = minX + Math.random() * (maxX - minX);
    for (let tries = 0; tries < 12; tries++) {
      const clash = g.words.some((w) => w.y < 110 && Math.abs(w.x - x) < wordHalfWidth(w.entry, w.text) + half);
      if (!clash) break;
      x = minX + Math.random() * (maxX - minX);
    }
    const travel = g.height - BASE_ZONE;
    const lenFactor = 1 + Math.max(0, romaji.length - 5) * 0.04;
    const fallTime = g.stage.fallTime * lenFactor * (0.9 + Math.random() * 0.2);
    g.words.push({
      id: nextId(),
      entry,
      text: romaji,
      units,
      st: newTypeState(),
      x,
      y: entry.jp ? -60 : -30,
      speed: travel / fallTime,
      hit: 0,
      shake: 0,
    });
    g.spawned++;
  }, [g]);

  const finish = useCallback(
    (phase: 'over' | 'victory') => {
      g.phase = phase;
      g.lockedId = null;
      g.newBest = g.score > getBest(g.deck.id);
      setBest(g.deck.id, g.score);
      g.dirty = true;
      if (phase === 'victory') sfx.victory();
      else sfx.gameOver();
      // Pre-render the share image so the share sheet opens instantly on click
      window.setTimeout(() => {
        renderScoreCard(cardData(g)).then((b) => (cardRef.current.blob = b));
      }, 700);
    },
    [g]
  );

  const destroyWord = useCallback(
    (w: FallingWord) => {
      const s = settingsRef.current;
      g.words = g.words.filter((o) => o.id !== w.id);
      g.lockedId = null;
      g.combo++;
      g.maxCombo = Math.max(g.maxCombo, g.combo);
      g.destroyed++;
      const mult = 1 + Math.min(g.combo, 20) * 0.1;
      const pts = Math.round(w.text.length * 10 * mult * (1 + g.stageIndex * 0.25));
      g.score += pts;
      const cy = w.y + 16;

      // Letters of the English word fly apart
      w.text.split('').forEach((ch, i) => {
        const px = w.x - (w.text.length * CHAR_W) / 2 + i * CHAR_W + CHAR_W / 2;
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 120 + Math.random() * 200;
        g.particles.push({
          id: nextId(),
          x: px,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0.9,
          maxLife: 0.9,
          color: '#5f7a5c',
          size: 20,
          char: ch,
        });
      });
      burst(w.x, cy, 26);

      // Flash + shockwave rings
      g.rings.push({ id: nextId(), x: w.x, y: cy, life: 0.35, maxLife: 0.35, color: '#fbf8f0', size: 130, flash: true });
      g.rings.push({ id: nextId(), x: w.x, y: cy, life: 0.6, maxLife: 0.6, color: '#c4a574', size: 170 });
      g.rings.push({ id: nextId(), x: w.x, y: cy, life: 0.85, maxLife: 0.85, color: '#5f7a5c', size: 240 });

      // Vietnamese meaning blows out of the explosion
      if (s.showVi) {
        const chars = Array.from(w.entry.vi);
        const half = Math.max(chars.length * 15, w.text.length * 10) / 2 + 14;
        const bx = g.width <= half * 2 + 12 ? g.width / 2 : clamp(w.x, half + 6, g.width - half - 6);
        const by = clamp(cy, 56, g.height - BASE_ZONE - 30);
        g.bursts.push({
          id: nextId(),
          x: bx,
          y: by,
          word: w.entry.jp ? `${w.entry.jp}${w.entry.kana !== w.entry.jp ? ` (${w.entry.kana})` : ''}` : w.text,
          pos: w.entry.pos,
          vi: w.entry.vi,
          pts,
          combo: g.combo,
          life: BURST_LIFE,
          maxLife: BURST_LIFE,
          seeds: chars.map(() => Math.random() * 2 - 1),
        });
      } else {
        g.floats.push({
          id: nextId(),
          x: w.x,
          y: w.y,
          text: `+${pts}${g.combo >= 3 ? `  x${g.combo}` : ''}`,
          life: 1,
          color: '#fbbf24',
        });
      }

      // Read the word aloud
      if (s.tts) say(w.entry);
      sfx.explode();

      if (!g.learned.includes(w.entry)) g.learned.push(w.entry);
    },
    [g, burst, say]
  );

  const mistake = useCallback(
    (w?: FallingWord) => {
      g.mistakes++;
      g.combo = 0;
      if (w) w.shake = 0.25;
      sfx.error();
    },
    [g]
  );

  const handleChar = useCallback(
    (raw: string) => {
      if (g.phase !== 'playing' || g.paused) return;
      const k = raw.toLowerCase();
      if (!/^[a-z'-]$/.test(k)) return;
      g.keystrokes++;

      let target = g.words.find((w) => w.id === g.lockedId);
      if (!target) {
        const candidates = g.words
          .filter((w) => canStart(w.units, k) && w.y > -45)
          .sort((a, b) => b.y - a.y);
        if (!candidates.length) {
          mistake();
          return;
        }
        target = candidates[0];
        g.lockedId = target.id;
      }

      if (feed(target.units, target.st, k)) {
        target.hit = 0.12;
        g.correct++;
        g.score += 2;
        g.lasers.push({ id: nextId(), x: target.x, y: target.y + 16, life: 0.12 });
        burst(target.x, target.y + 18, 5, '#8fa88a', 140);
        sfx.shoot();
        if (isComplete(target.units, target.st)) destroyWord(target);
      } else {
        mistake(target);
      }
    },
    [g, burst, destroyWord, mistake]
  );

  const handleBackspace = useCallback(() => {
    if (g.phase !== 'playing' || g.paused) return;
    const t = g.words.find((w) => w.id === g.lockedId);
    if (t) t.st = newTypeState();
    g.lockedId = null;
  }, [g]);

  // Physical keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inForm = tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === 'Escape') {
        setPaused(!g.paused);
        return;
      }
      if (g.phase === 'over' || g.phase === 'victory') {
        if (e.key === 'Enter' && tag !== 'BUTTON' && !inForm) onRestart();
        return;
      }
      if (g.paused || inForm) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }
      if (e.repeat || e.key.length !== 1) return;
      if (/^[a-zA-Z'-]$/.test(e.key)) {
        e.preventDefault();
        handleChar(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [g, handleChar, handleBackspace, onRestart, setPaused]);

  // Auto-pause when the window loses focus or the tab is hidden
  useEffect(() => {
    const pause = () => {
      if (g.phase === 'playing' || g.phase === 'countdown') setPaused(true);
    };
    const onVis = () => document.hidden && pause();
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [g, setPaused]);

  // Main game loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!g.paused) {
        // Visual effects
        g.particles = g.particles.filter((p) => {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += (p.char ? 420 : 300) * dt;
          p.vx *= 0.98;
          return p.life > 0;
        });
        g.lasers = g.lasers.filter((l) => (l.life -= dt) > 0);
        g.rings = g.rings.filter((r) => (r.life -= dt) > 0);
        g.bursts = g.bursts.filter((b) => (b.life -= dt) > 0);
        g.floats = g.floats.filter((f) => {
          f.life -= dt;
          f.y -= 50 * dt;
          return f.life > 0;
        });
        g.shake = Math.max(0, g.shake - dt);
        g.hurt = Math.max(0, g.hurt - dt);
        g.heartAnim = Math.max(0, g.heartAnim - dt);

        // Ship aims at the locked target
        const target = g.words.find((w) => w.id === g.lockedId);
        const shipX = g.width / 2;
        const shipY = g.height - 58;
        const desired = target ? Math.atan2(target.x - shipX, shipY - target.y) : 0;
        g.shipAngle += (desired - g.shipAngle) * Math.min(1, dt * 14);

        if (g.phase === 'countdown') {
          g.phaseTimer -= dt;
          const c = Math.ceil(g.phaseTimer);
          if (c > 0 && c !== g.lastCount) {
            g.lastCount = c;
            sfx.countdown(false);
          }
          if (g.phaseTimer <= 0) {
            g.phase = 'playing';
            g.spawnTimer = 0.2;
            g.lastCount = 0;
            sfx.countdown(true);
          }
        } else if (g.phase === 'stageClear') {
          g.phaseTimer -= dt;
          if (g.phaseTimer <= 0) {
            g.stageIndex++;
            g.stage = buildStage(g.deck, g.stageIndex, g.plan);
            g.spawned = 0;
            g.phase = 'countdown';
            g.phaseTimer = 3;
            g.lastCount = 0;
          }
        } else if (g.phase === 'playing') {
          g.playTime += dt;
          g.spawnTimer -= dt;
          if (g.spawned < g.stage.queue.length) {
            if (g.words.length === 0 || (g.spawnTimer <= 0 && g.words.length < g.stage.maxActive)) {
              spawnWord();
              g.spawnTimer = g.stage.spawnInterval * (0.8 + Math.random() * 0.4);
            }
          }
          const floor = g.height - BASE_ZONE;
          const survivors: FallingWord[] = [];
          for (const w of g.words) {
            w.y += w.speed * dt;
            w.hit = Math.max(0, w.hit - dt);
            w.shake = Math.max(0, w.shake - dt);
            if (w.y >= floor) {
              g.lives--;
              g.missed++;
              g.combo = 0;
              g.shake = 0.4;
              g.hurt = 0.6;
              g.heartAnim = 0.5;
              if (g.lockedId === w.id) g.lockedId = null;
              if (!g.missedWords.includes(w.entry)) g.missedWords.push(w.entry);
              burst(w.x, floor + 10, 40, '#b86b5a', 300);
              g.floats.push({ id: nextId(), x: w.x, y: floor - 20, text: '-1 ♥', life: 1, color: '#b86b5a' });
              sfx.hurt();
            } else survivors.push(w);
          }
          g.words = survivors;

          if (g.lives <= 0) {
            g.lives = 0;
            finish('over');
          } else if (g.spawned >= g.stage.queue.length && g.words.length === 0) {
            const bonus = 250 * (g.stageIndex + 1) + g.lives * 100;
            g.score += bonus;
            g.floats.push({
              id: nextId(),
              x: g.width / 2,
              y: g.height / 2 + 70,
              text: `Stage bonus +${bonus}`,
              life: 2,
              color: '#5f7a5c',
            });
            if (g.stageIndex >= STAGE_COUNT - 1) finish('victory');
            else {
              g.phase = 'stageClear';
              g.phaseTimer = 2.5;
              sfx.stageClear();
            }
          }
        }
      }

      const ended = g.phase === 'over' || g.phase === 'victory';
      const animating = g.particles.length + g.bursts.length + g.rings.length + g.floats.length > 0;
      if (g.dirty || (!g.paused && (!ended || animating))) {
        g.dirty = false;
        setTick((t) => (t + 1) % 1000000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [g, burst, finish, spawnWord]);

  const onShare = async () => {
    setShareState('working');
    const res = await shareScoreImage(cardData(g), cardRef.current.blob);
    setShareState(res === 'cancelled' ? 'idle' : res);
  };

  // ---------- Render ----------
  const locked = g.words.find((w) => w.id === g.lockedId);
  const shipX = g.width / 2;
  const shipY = g.height - 58;
  const accuracy = calcAccuracy(g);
  const wpm = calcWpm(g);
  const stageProgress = g.stage.queue.length ? (g.spawned - g.words.length) / g.stage.queue.length : 0;
  const shakeAmt = g.shake > 0 ? 14 * (g.shake / 0.4) : 0;
  const shakeX = shakeAmt ? (Math.random() - 0.5) * shakeAmt : 0;
  const shakeY = shakeAmt ? (Math.random() - 0.5) * shakeAmt : 0;
  const ended = g.phase === 'over' || g.phase === 'victory';
  const showKeyboard = keyboardVisible(settings.keyboard) && !ended;

  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      {/* ---------- Top nav ---------- */}
      <header className="relative z-30 flex h-[64px] shrink-0 items-center justify-between px-4 sm:px-6">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={onMenu}
          className="flex items-center gap-2.5 text-left"
          title="Chọn lại bộ thẻ"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-lg shadow-[var(--shadow-sm)]">
            🦜
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[18px] font-extrabold tracking-[-0.04em] text-[var(--ink)]">
              parroto<span className="text-[var(--rose)]">.</span>
            </span>
            <span className="eyebrow block text-[8px]">MỘT CHUYẾN ĐI NHỎ CỦA TỪ VỰNG</span>
          </span>
        </button>

        <nav className="flex items-center gap-6">
          <span className="relative flex items-center gap-2 pb-1 text-sm font-semibold text-[#244650] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:rounded-full after:bg-[#244650]">
            <span aria-hidden="true">☈</span>
            {g.deck.nameVi || g.deck.name}
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
          </span>
          <button
            onClick={() => setPaused(true)}
            className="hidden pb-1 text-sm font-semibold text-[#55727a] transition-colors hover:text-[#244650] sm:block"
          >
            Cách chơi
          </button>
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="hidden text-right leading-tight sm:block">
            <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-[var(--ink)]">
              <span aria-hidden="true">⛅</span> {clock}
            </div>
            <div className="eyebrow text-[8px]">GIỜ VÀNG</div>
          </div>
          <span className="hidden h-7 w-px bg-[var(--line)] sm:block" />
          <IconBtn
            active={settings.tts}
            onClick={() => onSettingsChange({ tts: !settings.tts })}
            title={settings.tts ? 'Đọc từ: BẬT' : 'Đọc từ: TẮT'}
          >
            {settings.tts ? '🔊' : '🔇'}
          </IconBtn>
          <IconBtn
            active={settings.showVi}
            onClick={() => onSettingsChange({ showVi: !settings.showVi })}
            title={settings.showVi ? 'Nghĩa tiếng Việt: BẬT' : 'Nghĩa tiếng Việt: TẮT'}
          >
            <span className="text-[11px] font-black tracking-tight">VI</span>
          </IconBtn>
          <IconBtn
            active={settings.sfx}
            onClick={() => onSettingsChange({ sfx: !settings.sfx })}
            title={settings.sfx ? 'Hiệu ứng: BẬT' : 'Hiệu ứng: TẮT'}
          >
            <span className={settings.sfx ? '' : 'opacity-40 grayscale'}>🎵</span>
          </IconBtn>
          <IconBtn active={g.paused} onClick={() => setPaused(!g.paused)} title="Tạm dừng (Esc)">
            {g.paused ? '▶' : '❚❚'}
          </IconBtn>
        </div>
      </header>

      {/* ---------- Viewport ---------- */}
      <div className="relative z-10 min-h-0 flex-1 px-3 pb-3 sm:px-5 sm:pb-4">
      <div
        ref={fieldRef}
        className="relative h-full overflow-hidden rounded-[26px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(113,143,158,0.72)_0%,rgba(112,149,157,0.68)_48%,rgba(66,109,119,0.78)_100%)] shadow-[var(--shadow)] select-none"
      >
        {/* drifting clouds inside the scene */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="cloud cloud-a absolute top-[8%] left-[-5%] h-28 w-[24rem] rounded-[100%] bg-white/65 blur-2xl" />
          <div className="cloud cloud-b absolute top-[30%] right-[-4%] h-36 w-[28rem] rounded-[100%] bg-white/55 blur-3xl" />
          <div className="cloud cloud-d absolute bottom-[16%] right-[12%] h-28 w-[22rem] rounded-[100%] bg-white/60 blur-2xl" />
          <span className="mote absolute top-[22%] left-[52%] h-1.5 w-1.5 rounded-full bg-white/80" />
          <span className="mote absolute top-[44%] left-[76%] h-1 w-1 rounded-full bg-white/70" style={{ animationDelay: '1.4s' }} />
        </div>

        

        {/* Soft sky playfield wash */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(215,230,239,0.25)_0%,rgba(251,248,240,0.1)_45%,rgba(223,232,216,0.3)_100%)]" />
        <div className="absolute inset-0" style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
          {/* Danger line */}
          <div
            className="absolute right-0 left-0 border-t-2 border-dashed border-[var(--rose)]/35"
            style={{ top: g.height - BASE_ZONE + 30 }}
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[var(--rose)]/10 to-transparent" />
          </div>

          {/* Lasers */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="laser" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#5f7a5c" />
                <stop offset="100%" stopColor="#c4a574" />
              </linearGradient>
            </defs>
            {locked && (
              <line
                x1={shipX}
                y1={shipY - 20}
                x2={locked.x}
                y2={locked.y + 32}
                stroke="#c4a574"
                strokeOpacity={0.35}
                strokeWidth={1.5}
                strokeDasharray="4 6"
              />
            )}
            {g.lasers.map((l) => (
              <g key={l.id} opacity={l.life / 0.12}>
                <line x1={shipX} y1={shipY - 20} x2={l.x} y2={l.y} stroke="url(#laser)" strokeWidth={6} strokeOpacity={0.28} />
                <line x1={shipX} y1={shipY - 20} x2={l.x} y2={l.y} stroke="#fbf8f0" strokeWidth={2} />
              </g>
            ))}
          </svg>

          {/* Shockwaves */}
          {g.rings.map((r) => {
            const t = 1 - r.life / r.maxLife;
            return r.flash ? (
              <div
                key={r.id}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: r.x,
                  top: r.y,
                  width: r.size,
                  height: r.size,
                  background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${r.color} 30%, transparent 70%)`,
                  opacity: 1 - t,
                  transform: `translate(-50%, -50%) scale(${0.3 + easeOutCubic(t) * 1.1})`,
                }}
              />
            ) : (
              <div
                key={r.id}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: r.x,
                  top: r.y,
                  width: r.size,
                  height: r.size,
                  border: `3px solid ${r.color}`,
                  boxShadow: `0 0 18px ${r.color}, inset 0 0 18px ${r.color}`,
                  opacity: (1 - t) * 0.85,
                  transform: `translate(-50%, -50%) scale(${0.1 + easeOutCubic(t) * 1.15})`,
                }}
              />
            );
          })}

          {/* Vietnamese meaning bursts (behind falling words so targets stay readable) */}
          {g.bursts.map((b) => (
            <MeaningBurstView key={b.id} b={b} />
          ))}

          {/* Falling words */}
          {g.words.map((w) => {
            const isLocked = w.id === g.lockedId;
            const danger = w.y / (g.height - BASE_ZONE);
            const sx = w.shake > 0 ? Math.sin(w.shake * 80) * 5 : 0;
            return (
              <div
                key={w.id}
                className="font-game absolute"
                style={{
                  left: w.x,
                  top: w.y,
                  transform: `translateX(calc(-50% + ${sx}px)) scale(${isLocked ? 1.15 : 1})`,
                  zIndex: isLocked ? 10 : 1,
                  transition: 'transform 0.12s',
                }}
              >
                <div
                  className={`relative flex items-center rounded-2xl border px-3 py-1.5 text-[22px] leading-none font-bold tracking-wide whitespace-nowrap shadow-[var(--shadow-sm)] ${
                    isLocked
                      ? 'lock-pulse border-[var(--sage)] bg-[var(--paper)]'
                      : danger > 0.75
                        ? 'border-[var(--rose)]/45 bg-[#f8ebe6]/95'
                        : 'border-[var(--line)] bg-[var(--paper)]/92'
                  } ${w.hit > 0 ? 'brightness-105' : ''}`}
                  style={{ boxShadow: isLocked ? '0 0 0 3px rgba(95,122,92,0.15), 0 10px 28px rgba(61,74,58,0.12)' : undefined }}
                >
                  {isLocked && <span className="absolute -left-4 text-[var(--sage)]">▸</span>}
                  {(() => {
                    const [typed, rest] = progressParts(w.units, w.st);
                    const restCls = isLocked ? 'text-[var(--ink)]' : danger > 0.75 ? 'text-[var(--rose)]' : 'text-[var(--ink)]';
                    const romajiLine = (
                      <span className={w.entry.jp ? 'text-[15px] tracking-wider' : ''}>
                        <span className="text-[var(--sage)]/45">{typed}</span>
                        {rest && (
                          <>
                            <span
                              className={
                                isLocked
                                  ? 'text-[var(--sage-deep)] underline decoration-2 underline-offset-4'
                                  : restCls
                              }
                            >
                              {rest[0]}
                            </span>
                            <span className={w.entry.jp ? (isLocked ? 'text-[var(--ink-soft)]' : 'text-[var(--muted)]') : restCls}>
                              {rest.slice(1)}
                            </span>
                          </>
                        )}
                      </span>
                    );
                    if (!w.entry.jp) return romajiLine;
                    return (
                      <span className="flex flex-col items-center gap-1 py-0.5">
                        {settings.showKana && w.entry.kana !== w.entry.jp && (
                          <span className="font-jp text-[11px] font-medium tracking-normal text-[var(--sage)]">
                            {w.entry.kana}
                          </span>
                        )}
                        <span className={`font-jp text-[26px] leading-none font-bold tracking-normal ${restCls}`}>
                          {w.entry.jp}
                        </span>
                        {romajiLine}
                      </span>
                    );
                  })()}
                  {isLocked && <span className="absolute -right-4 text-[var(--sage)]">◂</span>}
                </div>
                {settings.hints && (
                  <div className="font-vi mt-1 text-center text-xs font-medium whitespace-nowrap text-[var(--ink-soft)] [text-shadow:0_1px_0_rgba(251,248,240,0.9)]">
                    {w.entry.vi}
                  </div>
                )}
              </div>
            );
          })}

          {/* Particles */}
          {g.particles.map((p) =>
            p.char ? (
              <span
                key={p.id}
                className="font-game pointer-events-none absolute font-bold"
                style={{
                  left: p.x,
                  top: p.y,
                  color: p.color,
                  fontSize: p.size,
                  opacity: p.life / p.maxLife,
                  transform: `translate(-50%,-50%) rotate(${(1 - p.life / p.maxLife) * 360}deg)`,
                }}
              >
                {p.char}
              </span>
            ) : (
              <span
                key={p.id}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  opacity: p.life / p.maxLife,
                  boxShadow: `0 0 8px ${p.color}`,
                  transform: 'translate(-50%,-50%)',
                }}
              />
            )
          )}

          {/* Floating texts */}
          {g.floats.map((f) => (
            <span
              key={f.id}
              className="font-game pointer-events-none absolute text-lg font-black whitespace-nowrap"
              style={{
                left: f.x,
                top: f.y,
                color: f.color,
                opacity: Math.min(1, f.life * 1.5),
                transform: 'translateX(-50%)',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {f.text}
            </span>
          ))}

          {/* Base + ship */}
          <div className="absolute right-0 bottom-0 left-0 h-[70px] bg-gradient-to-t from-[#e8e2d4]/70 to-transparent" />
          <div
            className="absolute"
            style={{ left: shipX, top: shipY, transform: `translate(-50%,-50%) rotate(${g.shipAngle}rad)` }}
          >
            <Ship />
          </div>
        </div>

        {/* Damage vignette */}
        {g.hurt > 0 && (
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              opacity: g.hurt / 0.6,
              background: 'radial-gradient(ellipse at center, transparent 45%, rgba(184,107,90,0.35) 100%)',
            }}
          />
        )}

        {/* Typing console (bottom-left, beside the ship) */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[calc(50%-52px)]">
          <div className="font-game flex items-center gap-1.5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]/90 px-3 py-2 text-base shadow-[var(--shadow-sm)] backdrop-blur sm:text-lg">
            <span className="text-[var(--sage)]">›</span>
            {locked ? (
              <span className="truncate">
                {locked.entry.jp && <span className="font-jp mr-2 text-[var(--ink)]">{locked.entry.jp}</span>}
                <span className="text-[var(--sage-deep)]">{progressParts(locked.units, locked.st)[0]}</span>
                <span className="text-[var(--muted)]">{progressParts(locked.units, locked.st)[1]}</span>
              </span>
            ) : (
              <span className="truncate text-xs text-[var(--muted)] sm:text-sm">gõ để khóa mục tiêu…</span>
            )}
            <span className="ml-0.5 inline-block h-5 w-0.5 shrink-0 animate-pulse bg-[var(--sage)]" />
          </div>
        </div>

        {/* Countdown */}
        {g.phase === 'countdown' && !g.paused && (
          <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center">
            <div className="paper-card px-10 py-8 text-center shadow-[var(--shadow)]">
              <div className="eyebrow mb-2">THẾ GIỚI CÓ THỂ CHỜ</div>
              <div className="text-sm font-bold tracking-[0.2em] text-[var(--sage)] uppercase">
                Mốc {g.stageIndex + 1} · {g.stage.name}
              </div>
              <div
                key={Math.ceil(g.phaseTimer)}
                className="pop-in mt-2 text-7xl font-black text-[var(--ink)]"
              >
                {Math.ceil(g.phaseTimer)}
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">
                {g.stage.queue.length} từ ở mốc này · tối đa {g.stage.maxActive} từ cùng lúc
              </div>
            </div>
          </div>
        )}

        {/* Stage clear */}
        {g.phase === 'stageClear' && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="pop-in paper-card px-10 py-8 text-center shadow-[var(--shadow)]">
              <div className="text-5xl">🌿</div>
              <div className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--sage-deep)]">
                Xong mốc {g.stageIndex + 1}
              </div>
              <div className="font-vi mt-2 text-sm text-[var(--ink-soft)]">
                Bầu trời lặng hơn một chút… rồi mưa lại dày thêm.
              </div>
            </div>
          </div>
        )}

        {/* Pause */}
        {g.paused && !ended && (
          <Overlay>
            <div className="text-4xl">☁️</div>
            <p className="eyebrow mt-2">THẾ GIỚI CÓ THỂ CHỜ</p>
            <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink)]">Tạm nghỉ một chút.</h2>
            <p className="font-vi mt-1 text-sm text-[var(--ink-soft)]">Từ vựng của bạn đang ngắm cảnh.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Btn primary onClick={() => setPaused(false)}>
                ▶ Trở lại
              </Btn>
              <Btn onClick={onRestart}>↻ Chơi lại</Btn>
              <Btn onClick={onMenu}>☰ Chọn bộ thẻ</Btn>
            </div>
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--cream)]/60 p-4">
              <div className="eyebrow mb-3 text-left">CÀI ĐẶT</div>
              <SettingsPanel settings={settings} onChange={onSettingsChange} compact />
            </div>
          </Overlay>
        )}

        {/* Game over / Victory */}
        {ended && (
          <Overlay wide>
            <div className="text-5xl">{g.phase === 'victory' ? '🍃' : '🍂'}</div>
            <p className="eyebrow mt-2">
              {g.phase === 'victory' ? 'TẤT CẢ CÁC MỐC ĐÃ SẠCH' : 'TỪ ĐÃ LỌT XUỐNG ĐÁY'}
            </p>
            <h2 className="font-vi mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
              {g.phase === 'victory' ? 'Xong đẹp lắm.' : 'Hạ cánh êm ái.'}
            </h2>
            <p className="font-vi mt-2 text-sm text-[var(--ink-soft)]">
              {g.phase === 'victory'
                ? `Bạn đã vượt hết ${STAGE_COUNT} mốc của ${g.deck.nameVi || g.deck.name}.`
                : `Mưa đã chạm đất ở mốc ${g.stageIndex + 1}. Thở một nhịp, rồi chơi lại nhé.`}
            </p>
            {g.newBest && g.score > 0 && (
              <div className="font-vi mt-2 inline-block rounded-full bg-[var(--gold-soft)] px-3 py-1 text-sm font-bold text-[var(--ink)]">
                ⭐ Điểm cao nhất mới
              </div>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <Result label="Điểm" value={g.score.toLocaleString()} />
              <Result label="Đã bắn" value={g.destroyed} />
              <Result label="Bị lọt" value={g.missed} />
              <Result label="Chuỗi nhất" value={`x${g.maxCombo}`} />
              <Result label="Chính xác" value={`${accuracy}%`} />
              <Result label="Từ/phút" value={wpm} />
            </div>

            {(g.learned.length > 0 || g.missedWords.length > 0) && (
              <div className="mt-5 grid gap-4 text-left sm:grid-cols-2">
                <div>
                  <div className="eyebrow mb-2 text-[var(--sage)]">
                    ✓ TỪ ĐÃ BẮN ({g.learned.length})
                  </div>
                  <div className="grid max-h-48 gap-1.5 overflow-y-auto pr-1">
                    {g.learned.length ? (
                      g.learned.map((l) => <WordRow key={`${l.jp ?? ''}${l.word}`} entry={l} onSpeak={say} />)
                    ) : (
                      <div className="font-vi text-sm text-[var(--muted)]">Chưa có từ nào — thử lại nhé!</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="eyebrow mb-2 text-[var(--rose)]">
                    ✗ TỪ BỊ LỌT ({g.missedWords.length})
                  </div>
                  <div className="grid max-h-48 gap-1.5 overflow-y-auto pr-1">
                    {g.missedWords.length ? (
                      g.missedWords.map((l) => <WordRow key={`${l.jp ?? ''}${l.word}`} entry={l} onSpeak={say} miss />)
                    ) : (
                      <div className="font-vi text-sm text-[var(--muted)]">
                        Vẫn còn nguyên — không từ nào lọt! 🛡️
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Btn primary onClick={onRestart}>
                ↻ Chơi lại
              </Btn>
              <Btn onClick={onMenu}>☰ Chọn bộ thẻ</Btn>
              <Btn onClick={onShare} disabled={shareState === 'working'}>
                {shareState === 'working'
                  ? '⏳ Đang tạo ảnh…'
                  : shareState === 'downloaded'
                    ? '✅ Đã lưu ảnh'
                    : shareState === 'shared'
                      ? '✅ Đã chia sẻ'
                      : shareState === 'failed'
                        ? '⚠️ Thử lại'
                        : '📸 Chia sẻ ảnh điểm'}
              </Btn>
            </div>
            <p className="font-vi mt-3 text-xs text-[var(--muted)]">
              Nhấn Enter để chơi lại · nhấn 🔊 để nghe lại từ
            </p>
          </Overlay>
        )}
      </div>
      </div>

      {/* ---------- Bottom rail ---------- */}
      <footer className="relative z-30 shrink-0 px-4 pt-1 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* journey rail */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-soft)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-[var(--muted)]" /> Khởi hành
              </span>
              <span className="flex items-center gap-1.5">
                Trạm cuối
                <span className="h-2 w-2 rounded-full bg-[var(--sage)]" />
              </span>
            </div>
            <div className="relative mt-2 h-px w-full bg-[var(--line)]">
              <div
                className="absolute top-0 left-0 h-px bg-[var(--sage)] transition-[width] duration-500"
                style={{ width: `${clamp01((g.stageIndex + stageProgress) / STAGE_COUNT) * 100}%` }}
              />
              <span
                className="absolute top-1/2 grid h-5 w-5 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-[9px] shadow-sm transition-all duration-500"
                style={{
                  left: `${clamp01((g.stageIndex + stageProgress) / STAGE_COUNT) * 100}%`,
                  transform: 'translate(-50%,-50%)',
                }}
              >
                {g.deck.icon}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--muted)]">
              <span className={`flex items-center gap-1.5 ${g.heartAnim > 0 ? 'heart-loss' : ''}`}>
                <span aria-hidden="true">♡</span>
                <span className="font-game font-bold text-[var(--ink-soft)]">{g.lives}/3</span> mạng
              </span>
              <span className="flex items-center gap-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-[12px] transition-all duration-300 ${
                      i < g.lives ? 'opacity-100' : 'scale-75 opacity-25 grayscale'
                    }`}
                  >
                    ❤️
                  </span>
                ))}
              </span>
              <span className="hidden sm:inline">
                {g.lives === 3 ? 'Bầu trời vẫn êm đẹp' : g.lives === 2 ? 'Một từ vừa lọt' : 'Còn một nhịp thở'}
              </span>
            </div>
          </div>

          {/* readout */}
          <div className="flex items-end gap-5 border-t border-[var(--line)] pt-3 lg:border-t-0 lg:pt-0 lg:pl-6">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-game text-[34px] leading-none font-black text-[var(--sage-deep)]">
                  {String(g.score).padStart(4, '0')}
                </span>
                <span className="text-[11px] font-bold text-[var(--muted)]">điểm</span>
              </div>
              <div className="eyebrow mt-1 text-[8px]">NHẸ NHÀNG, ĐỪNG VỘI</div>
              <div className="mt-1.5 flex justify-center gap-1">
                {Array.from({ length: 16 }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-1 rounded-full ${
                      i / 16 < clamp01(stageProgress) ? 'bg-[var(--sage)]' : 'bg-[var(--line)]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="hidden text-center sm:block">
              <div className="font-game text-[34px] leading-none font-black text-[var(--ink)]">
                {String(g.stageIndex + 1).padStart(2, '0')}
                <span className="text-[16px] text-[var(--muted)]">/{STAGE_COUNT}</span>
              </div>
              <div className="eyebrow mt-1 text-[8px]">MỐC {g.stage.name.toUpperCase()}</div>
              <div className="mt-1.5 font-game text-[11px] text-[var(--ink-soft)]">
                {Math.round(clamp01(stageProgress) * g.stage.queue.length)}/{g.stage.queue.length} từ · {wpm} wpm ·{' '}
                {accuracy}%
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex items-stretch gap-3">
            <button onClick={onMenu} className="btn-ghost px-5 py-3.5 text-sm">
              <span className="mr-2" aria-hidden="true">↓</span>
              Rời khỏi
            </button>
            <button
              onClick={() => setPaused(!g.paused)}
              className="btn-sage flex items-center gap-3 px-7 py-3.5 text-[15px]"
            >
              <span className="text-base">{g.paused ? '▶' : '❚❚'}</span>
              <span className="text-left leading-tight">
                {g.paused ? 'TIẾP TỤC' : 'TẠM DỪNG'}
              </span>
              <span className="rounded-md border border-white/25 px-1.5 py-0.5 font-mono text-[10px]">Esc</span>
            </button>
          </div>
        </div>
      </footer>

      {showKeyboard && <VirtualKeyboard onChar={handleChar} onBackspace={handleBackspace} />}
    </div>
  );
}

/** The Vietnamese meaning "blows out" of the exploded word: letters fly from the centre into place. */
function MeaningBurstView({ b }: { b: MeaningBurst }) {
  const t = 1 - b.life / b.maxLife;
  const spread = easeOutBack(clamp01(t / 0.3));
  const k = 1 - spread; // 1 = collapsed in the centre, 0 = in place
  const rise = -42 * easeOutCubic(t);
  const fadeIn = clamp01(t / 0.05);
  const fadeOut = t < 0.72 ? 1 : clamp01(1 - (t - 0.72) / 0.28);
  const scale = 0.6 + 0.4 * easeOutBack(clamp01(t / 0.22));
  const labelIn = clamp01((t - 0.1) / 0.15);
  const chars = Array.from(b.vi);
  const n = chars.length;

  return (
    <div
      className="pointer-events-none absolute text-center"
      style={{
        left: b.x,
        top: b.y,
        transform: `translate(-50%, -50%) translateY(${rise}px) scale(${scale})`,
        opacity: fadeIn * fadeOut,
      }}
    >
      <div
        className="font-game text-[13px] font-bold tracking-widest text-[var(--sage-deep)]"
        style={{ opacity: labelIn, transform: `translateY(${(1 - labelIn) * 8}px)` }}
      >
        {b.word} <span className="text-[var(--muted)]">· {b.pos}.</span>
      </div>
      <div
        className="font-vi text-[26px] leading-tight font-extrabold whitespace-nowrap text-[var(--ink)]"
        style={{
          textShadow: '0 2px 12px rgba(251,248,240,0.9), 0 0 18px rgba(196,165,116,0.35)',
          letterSpacing: `${(1 - fadeOut) * 5}px`,
        }}
      >
        {chars.map((ch, i) => {
          const rel = i - (n - 1) / 2;
          const seed = b.seeds[i] ?? 0;
          return (
            <span
              key={i}
              className="inline-block whitespace-pre"
              style={{
                transform: `translate(${-rel * 15 * k}px, ${seed * 30 * k}px) rotate(${seed * 140 * k}deg) scale(${1 - 0.6 * k})`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      {b.pts > 0 && (
        <div className="font-game mt-0.5 text-sm font-black text-[var(--gold)]" style={{ opacity: labelIn }}>
          +{b.pts}
          {b.combo >= 3 && <span className="ml-1.5 text-[var(--rose)]">x{b.combo} combo</span>}
        </div>
      )}
    </div>
  );
}

function WordRow({ entry, onSpeak, miss }: { entry: WordEntry; onSpeak: (e: WordEntry) => void; miss?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--cream)]/70 px-2 py-1.5" title={entry.meaning}>
      <button
        onClick={() => onSpeak(entry)}
        className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-sm hover:bg-[var(--sage-soft)]"
        aria-label={`Pronounce ${entry.word}`}
      >
        🔊
      </button>
      <div className="min-w-0 leading-tight">
        <div>
          {entry.jp && (
            <span className={`font-jp mr-1 font-bold ${miss ? 'text-[var(--rose)]' : 'text-[var(--ink)]'}`}>{entry.jp}</span>
          )}
          <span className={`font-game ${entry.jp ? 'text-xs' : 'font-bold'} ${miss ? 'text-[var(--rose)]' : 'text-[var(--sage-deep)]'}`}>
            {entry.word}
          </span>{' '}
          <span className="text-[10px] text-[var(--muted)]">{entry.pos}.</span>
        </div>
        <div className="font-vi truncate text-xs text-[var(--ink-soft)]">{entry.vi}</div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
        active
          ? 'border-[var(--sage)]/60 bg-[var(--sage)] text-[var(--paper)] hover:bg-[var(--sage-deep)]'
          : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--paper-soft)]'
      }`}
    >
      {children}
    </button>
  );
}

function Result({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--cream)]/70 px-2 py-2">
      <div className="font-game text-xl font-black text-[var(--ink)]">{value}</div>
      <div className="eyebrow text-[8px]">{label}</div>
    </div>
  );
}

function Overlay({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#3d4a3a]/28 p-4 backdrop-blur-[6px] sm:items-center">
      <div
        className={`pop-in paper-card my-auto w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} p-5 text-center shadow-[var(--shadow)] sm:p-8`}
      >
        {children}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 ${
        primary ? 'btn-sage' : 'btn-ghost'
      }`}
    >
      {children}
    </button>
  );
}

const Ship = memo(function Ship() {
  return (
    <svg width="64" height="72" viewBox="0 0 64 72" className="drop-shadow-[0_8px_18px_rgba(95,122,92,0.28)]">
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7c3a0" />
          <stop offset="100%" stopColor="#5f7a5c" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8dcc8" />
          <stop offset="100%" stopColor="#c4a574" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M26 56 L32 72 L38 56 Z" fill="url(#flame)">
        <animate
          attributeName="d"
          values="M26 56 L32 72 L38 56 Z;M27 56 L32 66 L37 56 Z;M26 56 L32 72 L38 56 Z"
          dur="0.35s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M32 2 L46 40 L60 50 L60 56 L4 56 L4 50 L18 40 Z" fill="url(#hull)" stroke="#fbf8f0" strokeWidth="1.5" />
      <ellipse cx="32" cy="30" rx="6" ry="9" fill="#3d4a3a" stroke="#dfe8d8" strokeWidth="1.5" />
      <circle cx="32" cy="28" r="2.5" fill="#c4a574" />
      <rect x="29" y="0" width="6" height="8" rx="2" fill="#b86b5a" />
    </svg>
  );
});
