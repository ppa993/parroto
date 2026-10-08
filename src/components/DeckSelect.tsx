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
    <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
      {/* Top bar */}
      <header className="relative z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--line)] px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-xl shadow-[var(--shadow-sm)]">
            🦜
          </div>
          <div className="leading-tight">
            <div className="text-[20px] font-extrabold tracking-[-0.04em] text-[var(--ink)]">
              parroto<span className="text-[var(--rose)]">.</span>
            </div>
            <div className="eyebrow text-[9px]">a little journey of words</div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--ink-soft)] md:flex">
          <span className="relative text-[var(--sage)] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[var(--sage)]">
            Word decks
          </span>
          <span className="opacity-60">How to play</span>
        </nav>
        <div className="eyebrow hidden sm:block">type · learn · fly</div>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.95fr]">
          {/* Hero + language */}
          <section className="slide-up space-y-5">
            <div className="paper-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-[var(--sage-soft)]/70 blur-2xl" />
              <div className="absolute -bottom-20 left-10 h-40 w-56 rounded-full bg-[var(--gold-soft)]/60 blur-2xl" />
              <p className="eyebrow relative">the world can wait</p>
              <h1 className="relative mt-2 text-[clamp(2.4rem,5vw,3.6rem)] leading-[0.95] font-extrabold tracking-[-0.05em] text-[var(--ink)]">
                A little rain
                <br />
                of words.
              </h1>
              <p className="relative mt-4 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
                Words drift down from a quiet sky. Type them letter by letter before they reach the ground — then hear
                them spoken, and watch the{' '}
                <span className="font-semibold text-[var(--sage-deep)]">Vietnamese meaning</span> bloom out.
              </p>

              <div className="relative mt-6 inline-flex rounded-2xl border border-[var(--line)] bg-[var(--cream)]/80 p-1">
                {(
                  [
                    ['en', '🇬🇧', 'English', 'Tiếng Anh'],
                    ['ja', '🇯🇵', '日本語', 'Tiếng Nhật'],
                  ] as const
                ).map(([l, flag, label, vi]) => (
                  <button
                    key={l}
                    onClick={() => switchLang(l)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-left transition-all ${
                      settings.lang === l
                        ? 'bg-[var(--sage)] text-[var(--paper)] shadow-[0_6px_16px_rgba(74,99,72,0.2)]'
                        : 'text-[var(--ink-soft)] hover:bg-white/70'
                    }`}
                  >
                    <span className="text-xl">{flag}</span>
                    <span className="leading-tight">
                      <span className={`block text-sm font-bold ${l === 'ja' ? 'font-jp' : ''}`}>{label}</span>
                      <span className="font-vi block text-[11px] opacity-80">{vi}</span>
                    </span>
                  </button>
                ))}
              </div>

              {settings.lang === 'ja' && (
                <p className="font-vi relative mt-4 text-xs leading-relaxed text-[var(--ink-soft)]">
                  Type <b>romaji</b> to shoot Japanese words — 寿司 → <code className="rounded bg-[var(--cream-deep)] px-1">sushi</code>.
                  shi/si · tsu/tu · ん = n/nn · っ doubles · ー = <code className="rounded bg-[var(--cream-deep)] px-1">-</code>
                </p>
              )}
            </div>

            {/* Deck list */}
            <div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="eyebrow">01 · choose a flight path</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--ink)]">Pick a word deck</h2>
                </div>
                <p className="text-xs text-[var(--muted)]">{decks.length} decks · {deck.words.length} words here</p>
              </div>

              <div className="space-y-2.5">
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
                      style={{ animationDelay: `${i * 50}ms` }}
                      className={`slide-up group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? 'border-[var(--sage)] bg-[var(--paper)] shadow-[0_0_0_3px_rgba(95,122,92,0.12),var(--shadow-sm)]'
                          : 'border-[var(--line)] bg-[var(--paper)]/70 hover:border-[var(--sage)]/40 hover:bg-[var(--paper)] hover:shadow-[var(--shadow-sm)]'
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ${
                          active ? 'bg-[var(--sage-soft)]' : 'bg-[var(--cream-deep)]'
                        }`}
                      >
                        {d.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-bold text-[var(--ink)]">{d.name}</span>
                          <span className="rounded-full bg-[var(--cream-deep)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--ink-soft)] uppercase">
                            {d.level}
                          </span>
                        </div>
                        <p className="font-vi mt-0.5 truncate text-[12px] text-[var(--muted)]">
                          {d.nameVi} · {d.description}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <div className="eyebrow text-[8px]">Best</div>
                        <div className="font-game text-base font-bold text-[var(--gold)]">{best || '—'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right column */}
          <aside className="slide-up space-y-4" style={{ animationDelay: '80ms' }}>
            {/* Preview */}
            <div className="paper-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">Deck preview</span>
                <span className="text-xs text-[var(--muted)]">{deck.words.length} words</span>
              </div>
              <div className="mb-3 min-h-[52px] rounded-xl border border-[var(--line)] bg-[var(--cream)]/60 px-3 py-2.5">
                {peek ? (
                  <div className="slide-up flex items-center gap-3" key={`${peek.jp ?? ''}${peek.word}`}>
                    <button
                      onClick={() => hear(peek)}
                      className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-sm hover:bg-[var(--sage-soft)]"
                      aria-label={`Pronounce ${peek.word}`}
                    >
                      🔊
                    </button>
                    <div className="min-w-0 leading-tight">
                      <div>
                        {peek.jp && <span className="font-jp mr-1.5 text-lg font-bold text-[var(--ink)]">{peek.jp}</span>}
                        {peek.jp && peek.kana !== peek.jp && (
                          <span className="font-jp mr-1.5 text-xs text-[var(--sage)]">{peek.kana}</span>
                        )}
                        <span className="font-game text-sm font-bold text-[var(--sage-deep)]">{peek.word}</span>{' '}
                        <span className="text-xs text-[var(--muted)]">({peek.pos})</span>
                      </div>
                      <div className="font-vi text-sm font-semibold text-[var(--ink-soft)]">— {peek.vi}</div>
                      {peek.meaning && <div className="truncate text-xs text-[var(--muted)]">{peek.meaning}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="font-vi py-1.5 text-xs text-[var(--muted)]">
                    Tap a word to hear it · Nhấn vào từ để nghe phát âm
                  </div>
                )}
              </div>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {deck.words.slice(0, 80).map((wd) => (
                  <button
                    key={`${wd.jp ?? ''}${wd.word}`}
                    title={wd.meaning ? `${wd.vi} — ${wd.meaning}` : wd.jp ? `${wd.word} — ${wd.vi}` : wd.vi}
                    onClick={() => hear(wd)}
                    className={`${wd.jp ? 'font-jp' : 'font-game'} rounded-lg px-2 py-0.5 text-xs transition-colors ${
                      peek === wd
                        ? 'bg-[var(--sage)] text-[var(--paper)]'
                        : 'bg-[var(--cream)] text-[var(--ink-soft)] hover:bg-[var(--sage-soft)]'
                    }`}
                  >
                    {wd.jp ?? wd.word}
                  </button>
                ))}
                {deck.words.length > 80 && (
                  <span className="self-center px-1 text-[10px] text-[var(--muted)]">+{deck.words.length - 80} more</span>
                )}
              </div>
            </div>

            {/* Stage */}
            <div className="paper-card p-5">
              <p className="eyebrow mb-3">02 · starting stage</p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: STAGE_COUNT }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setStage(i)}
                    className={`rounded-xl border py-3 text-center transition-all ${
                      stage === i
                        ? 'border-[var(--sage)] bg-[var(--sage-soft)] text-[var(--sage-deep)] shadow-sm'
                        : 'border-[var(--line)] bg-[var(--cream)]/50 text-[var(--ink-soft)] hover:border-[var(--sage)]/40'
                    }`}
                  >
                    <div className="text-lg font-extrabold">{i + 1}</div>
                    <div className="text-[8px] tracking-wide uppercase opacity-70">{STAGE_NAMES[i]}</div>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                Each stage gently raises speed and density. Clear stage {STAGE_COUNT} to finish the journey.
              </p>
            </div>

            {/* Settings */}
            <div className="paper-card p-5">
              <p className="eyebrow mb-3">03 · sound & meaning</p>
              <SettingsPanel settings={settings} onChange={onSettingsChange} />
              {!ttsSupported && (
                <p className="mt-3 text-xs text-[var(--rose)]">
                  Speech isn’t available here — try Chrome, Edge or Safari for pronunciation.
                </p>
              )}
            </div>

            <button onClick={start} className="btn-sage w-full py-4 text-base tracking-tight">
              ▶ Start this flight
            </button>
            <p className="text-center text-[11px] text-[var(--muted)]">
              <kbd className="rounded border border-[var(--line)] bg-white px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>{' '}
              start ·{' '}
              <kbd className="rounded border border-[var(--line)] bg-white px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>{' '}
              pause ·{' '}
              <kbd className="rounded border border-[var(--line)] bg-white px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>{' '}
              deck
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
