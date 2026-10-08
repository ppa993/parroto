import { useCallback, useEffect, useState } from 'react';
import { DECKS, STAGE_COUNT, STAGE_NAMES, deckLang, getBest, type WordEntry } from '../data/decks';
import type { Settings } from '../lib/settings';
import { unlockAudio } from '../lib/sfx';
import { speak, ttsSupported, unlockSpeech } from '../lib/speech';
import SettingsPanel from './SettingsPanel';

type Props = {
  initialDeck?: string;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onStart: (deckId: string, stage: number) => void;
};

export default function DeckSelect({ initialDeck, settings, onSettingsChange, onStart }: Props) {
  const decks = DECKS.filter((d) => deckLang(d) === settings.lang);
  const [pickedId, setDeckId] = useState(initialDeck ?? decks[0].id);
  const [stage, setStage] = useState(0);
  const [peek, setPeek] = useState<WordEntry | null>(null);
  const deck = decks.find((d) => d.id === pickedId) ?? decks[0];
  const deckId = deck.id;
  const switchLang = (lang: 'en' | 'ja') => {
    if (lang === settings.lang) return;
    onSettingsChange({ lang });
    setDeckId(DECKS.find((d) => deckLang(d) === lang)!.id);
    setPeek(null);
  };

  const start = useCallback(() => {
    // Called inside a user gesture: unlock speech + audio for browsers with autoplay restrictions
    unlockSpeech();
    unlockAudio();
    onStart(deckId, stage);
  }, [deckId, stage, onStart]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        start();
        return;
      }
      const idx = decks.findIndex((d) => d.id === deckId);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDeckId(decks[(idx + 1) % decks.length].id);
        setPeek(null);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setDeckId(decks[(idx - 1 + decks.length) % decks.length].id);
        setPeek(null);
      }
      if (e.key === 'ArrowRight') setStage((s) => Math.min(STAGE_COUNT - 1, s + 1));
      if (e.key === 'ArrowLeft') setStage((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deckId, decks, start]);

  const hear = (wd: WordEntry) => {
    setPeek(wd);
    if (wd.kana) speak(wd.kana, { accent: settings.accent, rate: settings.rate, lang: 'ja' });
    else speak(wd.word, { accent: settings.accent, rate: settings.rate, voiceURI: settings.voiceURI });
  };

  return (
    <div className="relative z-10 flex h-full w-full flex-col items-center overflow-y-auto px-4 py-8">
      <div className="slide-up mb-8 text-center">
        <div className="floaty mb-2 text-6xl">🦜</div>
        <h1 className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-400 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
          Parroto
        </h1>
        <p className="mt-2 text-lg font-semibold tracking-[0.3em] text-cyan-200/80 uppercase">Word Rain</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
          Words rain down from the sky. Type them to blast them before they reach your base. The first letter locks your
          target. Finish the word to destroy it, hear it pronounced, and see its{' '}
          <span className="font-semibold text-amber-200">Vietnamese meaning</span> burst out!
        </p>
        <div className="mt-5 inline-flex rounded-2xl border border-white/15 bg-white/5 p-1">
          {(
            [
              ['en', '🇬🇧', 'English', 'Tiếng Anh'],
              ['ja', '🇯🇵', '日本語', 'Tiếng Nhật'],
            ] as const
          ).map(([l, flag, label, vi]) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-left transition-all ${
                settings.lang === l
                  ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{flag}</span>
              <span className="leading-tight">
                <span className={`block font-bold ${l === 'ja' ? 'font-jp' : ''}`}>{label}</span>
                <span className="font-vi block text-[11px] opacity-80">{vi}</span>
              </span>
            </button>
          ))}
        </div>
        {settings.lang === 'ja' && (
          <p className="font-vi mx-auto mt-3 max-w-xl text-xs text-pink-200/80">
            🇯🇵 Type the <b>romaji</b> to shoot Japanese words, e.g. 寿司 → <code>sushi</code>. Both shi/si, tsu/tu,
            chi/ti, ja/zya work · ん = n/nn · っ = double the consonant (kitte) · ー = <code>-</code>
          </p>
        )}
      </div>

      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left: decks + preview */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">1 · Choose a deck</h2>
          {decks.map((d, i) => {
            const active = d.id === deckId;
            const best = getBest(d.id);
            return (
              <button
                key={d.id}
                onClick={() => {
                  setDeckId(d.id);
                  setPeek(null);
                }}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`slide-up group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? 'border-cyan-300/70 bg-white/10 shadow-[0_0_30px_-5px_rgba(34,211,238,0.5)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${d.color} text-3xl shadow-lg`}
                >
                  {d.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-white">{d.name}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-200 uppercase">
                      {d.level}
                    </span>
                  </div>
                  <p className="font-vi truncate text-sm text-slate-400">
                    {d.nameVi} · {d.description}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, k) => (
                      <span
                        key={k}
                        className={`h-1.5 w-5 rounded-full ${k <= i ? 'bg-gradient-to-r ' + d.color : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-[10px] tracking-wider text-slate-500 uppercase">Best</div>
                  <div className="font-game text-lg font-bold text-amber-300">{best}</div>
                </div>
              </button>
            );
          })}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Deck preview</span>
              <span className="text-xs text-slate-500">{deck.words.length} words</span>
            </div>
            <div className="mb-3 min-h-[44px] rounded-xl bg-slate-950/60 px-3 py-2">
              {peek ? (
                <div className="slide-up flex items-center gap-3" key={peek.word}>
                  <button
                    onClick={() => hear(peek)}
                    className="rounded-lg bg-white/10 px-2 py-1 text-base hover:bg-white/20"
                    aria-label={`Pronounce ${peek.word}`}
                  >
                    🔊
                  </button>
                  <div className="min-w-0 leading-tight">
                    <div>
                      {peek.jp && <span className="font-jp mr-1.5 text-lg font-bold text-white">{peek.jp}</span>}
                      {peek.jp && peek.kana !== peek.jp && (
                        <span className="font-jp mr-1.5 text-xs text-pink-200">{peek.kana}</span>
                      )}
                      <span className="font-game font-bold text-cyan-200">{peek.word}</span>{' '}
                      <span className="text-xs text-slate-500">({peek.pos})</span>{' '}
                      <span className="font-vi font-semibold text-amber-200">— {peek.vi}</span>
                    </div>
                    {peek.meaning && <div className="truncate text-xs text-slate-400">{peek.meaning}</div>}
                  </div>
                </div>
              ) : (
                <div className="font-vi py-1.5 text-xs text-slate-500">
                  👆 Tap a word to hear it and see its meaning · Nhấn vào từ để nghe phát âm và xem nghĩa
                </div>
              )}
            </div>
            <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto pr-1">
              {deck.words.map((wd) => (
                <button
                  key={`${wd.jp ?? ''}${wd.word}`}
                  title={wd.meaning ? `${wd.vi} — ${wd.meaning}` : wd.jp ? `${wd.word} — ${wd.vi}` : wd.vi}
                  onClick={() => hear(wd)}
                  className={`${wd.jp ? 'font-jp' : 'font-game'} rounded-md px-2 py-0.5 text-xs transition-colors ${
                    peek === wd
                      ? 'bg-cyan-400/25 text-cyan-100'
                      : 'bg-white/5 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  {wd.jp ?? wd.word}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: stage + settings + start */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">2 · Starting stage</h2>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: STAGE_COUNT }, (_, i) => (
              <button
                key={i}
                onClick={() => setStage(i)}
                className={`rounded-xl border py-3 text-center transition-all ${
                  stage === i
                    ? 'border-amber-300 bg-amber-400/20 text-amber-200'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/30'
                }`}
              >
                <div className="text-xl font-black">{i + 1}</div>
                <div className="text-[9px] tracking-wide uppercase opacity-70">{STAGE_NAMES[i]}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Each stage increases falling speed, word length and spawn density. Clear stage {STAGE_COUNT} to win!
          </p>

          <h2 className="pt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">3 · Sound & meaning</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <SettingsPanel settings={settings} onChange={onSettingsChange} />
            {!ttsSupported && (
              <p className="mt-3 text-xs text-amber-300/80">
                Your browser does not support speech synthesis. Try Chrome, Edge or Safari for pronunciation.
              </p>
            )}
          </div>

          <button
            onClick={start}
            className={`w-full rounded-2xl bg-gradient-to-r ${deck.color} py-4 text-xl font-black text-white shadow-xl transition-transform hover:scale-[1.02] active:scale-95`}
          >
            ▶ START GAME
          </button>
          <p className="text-center text-xs text-slate-500">
            <kbd className="rounded bg-white/10 px-1.5">Enter</kbd> start · <kbd className="rounded bg-white/10 px-1.5">Esc</kbd>{' '}
            pause · <kbd className="rounded bg-white/10 px-1.5">Backspace</kbd> release target ·{' '}
            <kbd className="rounded bg-white/10 px-1.5">↑↓</kbd> deck
          </p>
        </div>
      </div>
    </div>
  );
}
