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

/** Vietnamese copy for each deck (level + one-line description). */
const DECK_VI: Record<string, { level: string; desc: string }> = {
  basics: { level: 'Người mới', desc: 'Những từ đơn giản bạn dùng mỗi ngày.' },
  nature: { level: 'Sơ cấp', desc: 'Động vật, cây cối và thế giới tự nhiên.' },
  travel: { level: 'Trung cấp', desc: 'Chuyến đi, khách sạn và những món ăn ngon.' },
  business: { level: 'Cao hơn', desc: 'Văn phòng, tài chính và từ vựng công sở.' },
  academic: { level: 'Nâng cao', desc: 'Từ dài, khó dành cho bài thi và bài luận.' },
  'ja-n5': { level: 'N5', desc: 'Những từ đầu tiên: con người, thời gian, con số.' },
  'ja-food': { level: 'Ẩm thực', desc: 'Gọi ramen, đi tàu cao tốc, tìm suối nóng.' },
  'ja-verbs': { level: 'Trung cấp', desc: 'Động từ và tính từ trong đời sống hàng ngày.' },
  'ja-katakana': { level: 'Katakana', desc: 'Từ mượn dài với chữ ー và kana nhỏ.' },
  'ja-mina-no-nihongo': { level: 'Bài 1–6', desc: 'Từ vựng Mina no Nihongo từ bài 1 đến bài 6.' },
};

const HELP_STEPS: [string, string, string][] = [
  ['1', 'Chọn một bộ thẻ', 'Mỗi bộ thẻ là một tuyến đường; các mốc bên trong sẽ nối tiếp nhau.'],
  ['2', 'Gõ chữ cái đầu để khóa', 'Chữ đầu tiên khóa mục tiêu, gõ nốt các chữ còn lại để bắn hạ từ.'],
  ['3', 'Bắn hết để qua mốc', 'Tốc độ rơi và mật độ từ tăng dần sau mỗi mốc.'],
  ['4', 'Giữ 3 mạng', 'Mỗi từ chạm đáy sẽ mất 1 mạng. Vượt qua mốc cuối để thắng.'],
];

export default function DeckSelect({ initialDeck, settings, onSettingsChange, onStart }: Props) {
  const decks = DECKS.filter((d) => deckLang(d) === settings.lang);
  const [pickedId, setDeckId] = useState(initialDeck ?? decks[0].id);
  const [stage, setStage] = useState(0);
  const [peek, setPeek] = useState<WordEntry | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const deck = decks.find((d) => d.id === pickedId) ?? decks[0];
  const deckId = deck.id;
  const vi = DECK_VI[deck.id] ?? { level: 'Từ vựng', desc: 'Một bộ thẻ từ vựng.' };

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
      if (helpOpen && e.key === 'Escape') {
        setHelpOpen(false);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        setHelpOpen(false);
        start();
        return;
      }
      if (helpOpen) return;
      const idx = decks.findIndex((d) => d.id === deckId);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDeckId(decks[(idx + 1) % decks.length].id);
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
  }, [deckId, decks, start, helpOpen]);

  const hear = (wd: WordEntry) => {
    setPeek(wd);
    if (wd.kana) speak(wd.kana, { accent: settings.accent, rate: settings.rate, lang: 'ja' });
    else speak(wd.word, { accent: settings.accent, rate: settings.rate, voiceURI: settings.voiceURI });
  };

  return (
    <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
      {/* ---------- Top bar ---------- */}
      <header className="relative z-20 flex h-[74px] shrink-0 items-center justify-between px-5 sm:px-8">
        <a className="flex items-center gap-3" href="#top" onClick={(e) => e.preventDefault()}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-xl shadow-[var(--shadow-sm)]">
            🦜
          </span>
          <span className="leading-tight">
            <span className="block text-[22px] font-extrabold tracking-[-0.04em] text-[var(--ink)]">
              parroto<span className="text-[var(--rose)]">.</span>
            </span>
            <span className="eyebrow block text-[8px]">MỘT CHUYẾN ĐI NHỎ CỦA TỪ VỰNG</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <span className="relative pb-1 text-sm font-semibold text-[#244650] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:rounded-full after:bg-[#244650]">
            Bộ thẻ từ vựng
          </span>
          <button
            onClick={() => setHelpOpen(true)}
            className="pb-1 text-sm font-semibold text-[#55727a] transition-colors hover:text-[#244650]"
          >
            Cách chơi
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-[var(--ink)]">
              <span aria-hidden="true">⛅</span> {clock}
            </div>
            <div className="eyebrow text-[8px]">GIỜ VÀNG</div>
          </div>
          <span className="hidden h-7 w-px bg-[var(--line)] sm:block" />
          <button
            onClick={() => onSettingsChange({ sfx: !settings.sfx, tts: !settings.tts ? true : settings.tts })}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-sm hover:bg-white"
            title={settings.sfx ? 'Bật tiếng' : 'Tắt tiếng'}
            aria-label="Âm thanh"
          >
            {settings.sfx ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      {/* ---------- Viewport (big rounded scene card) ---------- */}
      <div className="relative z-10 min-h-0 flex-1 px-3 pb-3 sm:px-5 sm:pb-4">
        <div className="relative h-full overflow-hidden rounded-[26px] border border-[var(--line)] bg-[linear-gradient(180deg,#718f9e_0%,#88aab5_38%,#70959d_72%,#426d77_100%)] shadow-[var(--shadow)]">
          {/* clouds */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="cloud cloud-a absolute top-[6%] left-[-6%] h-36 w-[26rem] rounded-[100%] bg-white/70 blur-2xl" />
            <div className="cloud cloud-b absolute top-[26%] right-[-4%] h-44 w-[30rem] rounded-[100%] bg-white/60 blur-3xl" />
            <div className="cloud cloud-c absolute bottom-[24%] left-[8%] h-32 w-[22rem] rounded-[100%] bg-white/55 blur-2xl" />
            <div className="cloud cloud-d absolute bottom-[12%] right-[14%] h-40 w-[26rem] rounded-[100%] bg-white/65 blur-2xl" />
            <span className="mote absolute top-[18%] left-[46%] h-1.5 w-1.5 rounded-full bg-white/80" />
            <span className="mote absolute top-[36%] left-[70%] h-1 w-1 rounded-full bg-white/70" style={{ animationDelay: '1.4s' }} />
          </div>

          {/* content */}
            <div className="scrollbar-none relative z-10 h-full overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
            <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.12fr_0.98fr]">
              {/* ---- Left column ---- */}
              <div className="space-y-4">
                {/* Next-stop card */}
                <div className="slide-up max-w-md rounded-3xl border border-white/70 bg-[rgba(251,248,240,0.92)] p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--cream)] text-xl">
                      {deck.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="eyebrow text-[8px]">BỘ THẺ CỦA BẠN</p>
                      <div className="flex items-center gap-2">
                        <h1 className="truncate text-[26px] leading-tight font-extrabold tracking-[-0.03em] text-[var(--ink)]">
                          {deck.nameVi || deck.name}
                        </h1>
                        <span aria-hidden="true" className="text-[var(--muted)]">↗</span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
                        {deck.words.length} từ · {vi.level}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chips */}
                <div className="slide-up flex flex-wrap gap-2" style={{ animationDelay: '60ms' }}>
                  <span className="flex items-center gap-2 rounded-2xl border border-white/70 bg-[rgba(251,248,240,0.92)] px-3 py-2 shadow-[var(--shadow-sm)]">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--gold-soft)] text-xs">✦</span>
                    <span className="font-game text-sm font-bold text-[var(--ink)]">{getBest(deck.id)}</span>
                    <span className="text-[11px] text-[var(--muted)]">điểm cao nhất</span>
                  </span>
                  <span className="flex items-center gap-2 rounded-2xl border border-white/70 bg-[rgba(251,248,240,0.92)] px-3 py-2 shadow-[var(--shadow-sm)]">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--sage-soft)] text-xs">✧</span>
                    <span className="font-game text-sm font-bold text-[var(--ink)]">{STAGE_COUNT}×</span>
                    <span className="text-[11px] text-[var(--muted)]">các mốc</span>
                  </span>
                </div>

                {/* Hero */}
                <div className="slide-up pt-2" style={{ animationDelay: '110ms' }}>
                  <p className="eyebrow">GIỮA TRỜI VÀ MÂY</p>
                  <h2 className="mt-1 text-[clamp(2rem,4.4vw,3.1rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-[var(--ink)] [text-shadow:0_2px_16px_rgba(24,59,67,0.24)]">
                    Một cơn mưa
                    <br />
                    từ vựng.
                  </h2>
                  <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[var(--ink-soft)]">
                    Từ rơi xuống từ bầu trời. Gõ thật nhanh để bắn hạ trước khi chạm mặt đất — rồi nghe từ được phát
                    âm và nhìn <b className="text-[var(--sage-deep)]">nghĩa tiếng Việt</b> bung ra.
                  </p>
                </div>

                {/* Deck rail */}
                <div className="slide-up" style={{ animationDelay: '160ms' }}>
                  <div className="mb-2 flex items-end justify-between">
                    <p className="eyebrow">01 · CHỌN TUYẾN ĐƯỜNG</p>
                    <p className="text-[11px] text-[var(--ink-soft)]">{decks.length} bộ thẻ</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {decks.map((d, i) => {
                      const active = d.id === deckId;
                      const dvi = DECK_VI[d.id] ?? { level: 'Từ vựng', desc: '' };
                      return (
                        <button
                          key={d.id}
                          onClick={() => {
                            setDeckId(d.id);
                            setPeek(null);
                          }}
                          style={{ animationDelay: `${i * 50}ms` }}
                          className={`slide-up flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                            active
                              ? 'border-[var(--sage)] bg-[var(--paper)] shadow-[0_0_0_3px_rgba(95,122,92,0.12),var(--shadow-sm)]'
                              : 'border-white/70 bg-[rgba(251,248,240,0.75)] hover:bg-[var(--paper)] hover:shadow-[var(--shadow-sm)]'
                          }`}
                        >
                          <span
                            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${
                              active ? 'bg-[var(--sage-soft)]' : 'bg-[var(--cream-deep)]'
                            }`}
                          >
                            {d.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[14px] font-bold text-[var(--ink)]">{d.nameVi || d.name}</span>
                              <span className="rounded-full bg-[var(--cream-deep)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--ink-soft)] uppercase">
                                {dvi.level}
                              </span>
                            </span>
                            <span className="font-vi mt-0.5 block truncate text-[11px] text-[var(--muted)]">{dvi.desc}</span>
                          </span>
                          <span className="font-game text-[12px] font-bold text-[var(--gold)]">
                            {getBest(d.id) || '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ---- Right column ---- */}
              <div className="slide-up space-y-3" style={{ animationDelay: '90ms' }}>
                {/* Route card (stage list, like the coastal line panel) */}
                <div className="rounded-3xl border border-white/70 bg-[rgba(251,248,240,0.94)] p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow text-[8px]">TUYẾN {deck.nameVi || deck.name}</p>
                    <span className="text-[var(--muted)]" aria-hidden="true">⤢</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-1">
                    {Array.from({ length: STAGE_COUNT }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setStage(i)}
                        className={`flex flex-col items-center gap-1 rounded-xl px-1.5 py-1.5 transition-all ${
                          stage === i ? 'bg-[var(--sage-soft)]' : 'hover:bg-[var(--cream)]'
                        }`}
                      >
                        <span
                          className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${
                            i <= stage ? 'border-[var(--sage)] bg-[var(--sage)]' : 'border-[var(--line)] bg-white'
                          } ${stage === i ? 'ring-4 ring-[var(--sage)]/20' : ''}`}
                        />
                        <span
                          className={`text-[10px] font-bold ${stage === i ? 'text-[var(--sage-deep)]' : 'text-[var(--muted)]'}`}
                        >
                          {STAGE_NAMES[i]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 h-px bg-[var(--line)]" />
                  <p className="font-vi mt-2 text-[11px] text-[var(--muted)]">
                    Mốc {stage + 1} bắt đầu · tốc độ và mật độ tăng dần ở mỗi chặng.
                  </p>
                </div>

                {/* Word preview */}
                <div className="rounded-3xl border border-white/35 bg-[rgba(251,248,240,0.94)] p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="eyebrow text-[8px]">XEM TRƯỚC TỪ</p>
                    <p className="text-[11px] text-[var(--muted)]">{deck.words.length} từ</p>
                  </div>
                  <div className="mb-2.5 min-h-[46px] rounded-xl border border-[var(--line)] bg-[var(--cream)]/70 px-3 py-2">
                    {peek ? (
                      <div className="slide-up flex items-center gap-2.5" key={`${peek.jp ?? ''}${peek.word}`}>
                        <button
                          onClick={() => hear(peek)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-white text-sm hover:bg-[var(--sage-soft)]"
                          aria-label={`Nghe ${peek.word}`}
                        >
                          🔊
                        </button>
                        <div className="min-w-0 leading-tight">
                          <div>
                            {peek.jp && <span className="font-jp mr-1.5 text-[17px] font-bold text-[var(--ink)]">{peek.jp}</span>}
                            {peek.jp && peek.kana !== peek.jp && (
                              <span className="font-jp mr-1.5 text-[11px] text-[var(--sage-deep)]">{peek.kana}</span>
                            )}
                            <span className="font-game text-[13px] font-bold text-[var(--sage-deep)]">{peek.word}</span>
                            <span className="text-[11px] text-[var(--muted)]"> ({peek.pos})</span>
                          </div>
                          <div className="font-vi text-[13px] font-semibold text-[var(--ink-soft)]">— {peek.vi}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="font-vi py-1.5 text-[11px] text-[#365963]">
                        Chạm vào một từ để nghe cách đọc và xem nghĩa
                      </div>
                    )}
                  </div>
                  <div className="scrollbar-none flex max-h-32 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {deck.words.slice(0, 60).map((wd) => (
                      <button
                        key={`${wd.jp ?? ''}${wd.word}`}
                        title={wd.meaning ? `${wd.vi} — ${wd.meaning}` : wd.jp ? `${wd.word} — ${wd.vi}` : wd.vi}
                        onClick={() => hear(wd)}
                        className={`${wd.jp ? 'font-jp' : 'font-game'} rounded-lg px-2 py-0.5 text-[11px] transition-colors ${
                          peek === wd
                            ? 'bg-[var(--sage)] text-[var(--paper)]'
                            : 'bg-[var(--cream)] text-[#294d57] hover:bg-[var(--sage-soft)]'
                        }`}
                      >
                        {wd.jp ?? wd.word}
                      </button>
                    ))}
                    {deck.words.length > 60 && (
                      <span className="self-center px-1 text-[10px] text-[var(--muted)]">
                        +{deck.words.length - 60} từ nữa
                      </span>
                    )}
                  </div>
                </div>

                {/* Language + settings */}
                <div className="rounded-3xl border border-white/70 bg-[rgba(251,248,240,0.94)] p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                  <p className="eyebrow mb-2 text-[8px]">02 · NGÔN NGỮ & ÂM THANH</p>
                  <div className="mb-3 inline-flex rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-1">
                    {(
                      [
                        ['en', '🇬🇧', 'Tiếng Anh'],
                        ['ja', '🇯🇵', 'Tiếng Nhật'],
                      ] as const
                    ).map(([l, flag, label]) => (
                      <button
                        key={l}
                        onClick={() => switchLang(l)}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all ${
                          settings.lang === l
                            ? 'bg-[var(--sage)] text-[var(--paper)] shadow-[0_6px_16px_rgba(74,99,72,0.18)]'
                            : 'text-[#294d57] hover:bg-white/70'
                        }`}
                      >
                        <span className="text-base">{flag}</span> {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="btn-ghost flex w-full items-center justify-between px-3 py-2.5 text-left text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">⚙</span>
                      <span>Thêm cài đặt</span>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                  {!ttsSupported && (
                    <p className="font-vi mt-3 text-[11px] text-[var(--rose)]">
                      Trình duyệt này chưa hỗ trợ đọc từ — thử Chrome, Edge hoặc Safari nhé.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Bottom rail ---------- */}
      <footer className="relative z-20 shrink-0 px-4 pb-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* journey progress */}
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
                className="absolute top-0 left-0 h-px bg-[var(--sage)]"
                style={{ width: `${((stage + 1) / STAGE_COUNT) * 100}%` }}
              />
              <span
                className="absolute top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-[9px] shadow-sm transition-all"
                style={{ left: `${((stage + 1) / STAGE_COUNT) * 100}%`, transform: 'translate(-50%,-50%)' }}
              >
                {deck.icon}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <span aria-hidden="true">♡</span> {vi.desc}
            </div>
          </div>

          {/* readout */}
          <div className="flex items-end gap-5 border-t border-[var(--line)] pt-3 lg:border-t-0 lg:pt-0">
            <div className="text-center">
              <div className="font-game text-[34px] leading-none font-black text-[var(--sage-deep)]">
                {String(deck.words.length).padStart(3, '0')}
              </div>
              <div className="eyebrow text-[8px]">TỪ TRONG BỘ</div>
            </div>
            <div className="text-center">
              <div className="font-game text-[34px] leading-none font-black text-[var(--ink)]">
                {String(stage + 1).padStart(2, '0')}
                <span className="text-[16px] text-[var(--muted)]">/{STAGE_COUNT}</span>
              </div>
              <div className="eyebrow text-[8px]">MỐC BẮT ĐẦU</div>
            </div>
          </div>

          {/* actions */}
          <div className="flex items-stretch gap-3">
            <button onClick={() => setHelpOpen(true)} className="btn-ghost px-5 py-3.5 text-sm">
              <span className="mr-2" aria-hidden="true">↓</span>
              Hướng dẫn
            </button>
            <button onClick={start} className="btn-sage flex items-center gap-3 px-7 py-3.5 text-[15px]">
              <span className="text-base">↑</span>
              <span className="text-left leading-tight">
                BẮT ĐẦU
                <span className="block text-[9px] font-medium tracking-widest opacity-70">NHẤN ENTER</span>
              </span>
              <span className="rounded-md border border-white/25 px-1.5 py-0.5 font-mono text-[10px]">↵</span>
            </button>
          </div>
        </div>
      </footer>

      {/* ---------- Help dialog ---------- */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d4a3a]/30 p-4 backdrop-blur-[6px]"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setHelpOpen(false)}
        >
          <div
            className="pop-in paper-card w-full max-w-lg p-6 shadow-[var(--shadow)]"
            role="dialog"
            aria-modal="true"
            aria-label="Cách chơi"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">HƯỚNG DẪN NHANH</p>
                <h3 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[var(--ink)]">Cách chơi</h3>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-white text-[#244650] hover:bg-[var(--sage-soft)]"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <ol className="mt-4 divide-y divide-[var(--line)]">
              {HELP_STEPS.map(([n, title, desc]) => (
                <li key={n} className="flex gap-3 py-3">
                  <span className="font-game grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--sage-soft)] text-[12px] font-bold text-[var(--sage-deep)]">
                    {n}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[var(--ink)]">{title}</p>
                    <p className="font-vi text-[12px] leading-relaxed text-[var(--ink-soft)]">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            {settings.lang === 'ja' && (
              <p className="font-vi mt-3 rounded-xl bg-[var(--cream)] px-3 py-2 text-[12px] text-[var(--ink-soft)]">
                Tiếng Nhật: gõ <b>romaji</b>, ví dụ 寿司 → <code className="rounded bg-[var(--cream-deep)] px-1">sushi</code>.
                Shì/si, tsu/tu đều được · ん = n/nn · っ = gấp đôi phụ âm · ー = <code className="rounded bg-[var(--cream-deep)] px-1">-</code>
              </p>
            )}
            <button onClick={() => setHelpOpen(false)} className="btn-sage mt-5 w-full py-3 text-sm">
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102f38]/45 p-4 backdrop-blur-[6px]"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setSettingsOpen(false)}
        >
          <div className="pop-in paper-card w-full max-w-lg p-6 shadow-[var(--shadow)]" role="dialog" aria-modal="true" aria-label="Cài đặt">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">TÙY CHỈNH CHUYẾN ĐI</p>
                <h3 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[var(--ink)]">Cài đặt</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-white text-[#244650] hover:bg-[var(--sage-soft)]"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="mt-5">
              <SettingsPanel settings={settings} onChange={onSettingsChange} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
