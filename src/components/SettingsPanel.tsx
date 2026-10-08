import type { ReactNode } from 'react';
import type { KeyboardMode, Settings } from '../lib/settings';
import { speak, ttsSupported, useEnglishVoices, type Accent } from '../lib/speech';

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  compact?: boolean;
};

export default function SettingsPanel({ settings, onChange, compact }: Props) {
  const voices = useEnglishVoices();
  const accent = settings.accent.toLowerCase();
  const sortedVoices = [...voices].sort((a, b) => {
    const am = a.lang.replace('_', '-').toLowerCase() === accent ? 0 : 1;
    const bm = b.lang.replace('_', '-').toLowerCase() === accent ? 0 : 1;
    return am - bm || a.name.localeCompare(b.name);
  });

  const test = (voiceURI = settings.voiceURI, word = 'parrot') =>
    speak(word, { accent: settings.accent, rate: settings.rate, voiceURI });

  return (
    <div className="space-y-2.5 text-left">
      <ToggleRow
        icon="🔊"
        title="Đọc từ thành tiếng"
        sub={ttsSupported ? 'Nghe pronunciation mỗi khi bắn hạ từ' : 'Trình duyệt này chưa hỗ trợ đọc từ'}
        checked={settings.tts && ttsSupported}
        disabled={!ttsSupported}
        onChange={(v) => onChange({ tts: v })}
      />
      {settings.tts && ttsSupported && (
        <div className="ml-11 flex flex-wrap items-center gap-2">
          <Segmented
            value={settings.accent}
            options={[
              ['en-US', 'US'],
              ['en-GB', 'UK'],
            ]}
            onChange={(v) => {
              onChange({ accent: v as Accent, voiceURI: '' });
              speak('hello', { accent: v as Accent, rate: settings.rate });
            }}
          />
          <Segmented
            value={String(settings.rate)}
            options={[
              ['0.75', 'Slow'],
              ['0.95', 'Normal'],
              ['1.15', 'Fast'],
            ]}
            onChange={(v) => onChange({ rate: Number(v) })}
          />
          {!compact && sortedVoices.length > 0 && (
            <select
              value={settings.voiceURI}
              onChange={(e) => {
                onChange({ voiceURI: e.target.value });
                test(e.target.value, 'hello');
              }}
              className="max-w-[210px] rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs text-[#244650] outline-none focus:border-[var(--sage)]"
              aria-label="Voice"
            >
              <option value="">Auto voice</option>
              {sortedVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}
          <button onClick={() => test()} className="btn-ghost border-[#6f9298] px-2.5 py-1 text-xs font-semibold text-[#e4eee9]">
            ▶ Test
          </button>
        </div>
      )}
      <ToggleRow
        icon="💥"
        title="Nghĩa tiếng Việt bung ra"
        sub="Khi từ phát nổ, nghĩa tiếng Việt sẽ bung ra theo"
        checked={settings.showVi}
        onChange={(v) => onChange({ showVi: v })}
      />
      <ToggleRow
        icon="💡"
        title="Gợi ý nghĩa dưới từ"
        sub="Hiện nghĩa tiếng Việt ngay dưới từ đang rơi (dễ hơn)"
        checked={settings.hints}
        onChange={(v) => onChange({ hints: v })}
      />
      {settings.lang === 'ja' && (
        <ToggleRow
          icon="あ"
          title="Hiện cách đọc kana"
          sub="Hiển thị đọc hiragana phía trên chữ Kanji"
          checked={settings.showKana}
          onChange={(v) => onChange({ showKana: v })}
        />
      )}
      <ToggleRow
        icon="🎵"
        title="Hiệu ứng âm thanh"
        sub="Tiếng bắn, tiếng nổ khi hạ từ"
        checked={settings.sfx}
        onChange={(v) => onChange({ sfx: v })}
      />
      <Row icon="⌨️" title="Bàn phím trên màn hình" sub="Dành cho điện thoại và iPad">
        <Segmented
          value={settings.keyboard}
          options={[
            ['auto', 'Auto'],
            ['on', 'On'],
            ['off', 'Off'],
          ]}
          onChange={(v) => onChange({ keyboard: v as KeyboardMode })}
        />
      </Row>
    </div>
  );
}

function Row({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cream-deep)] text-base">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--ink)]">{title}</div>
        {sub && <div className="truncate text-[11px] text-[var(--muted)]">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  sub,
  checked,
  disabled,
  onChange,
}: {
  icon: string;
  title: string;
  sub?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row icon={icon} title={title} sub={sub}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          checked ? 'bg-[var(--sage)]' : 'bg-[var(--cream-deep)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </Row>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-[var(--line)] bg-[var(--cream)] p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === v ? 'bg-[var(--sage)] text-[var(--paper)]' : 'text-[#294d57] hover:text-[#173941]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
