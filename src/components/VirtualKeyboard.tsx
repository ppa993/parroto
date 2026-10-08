import { memo, useState, type PointerEvent } from 'react';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

type Props = {
  onChar: (c: string) => void;
  onBackspace: () => void;
};

function VirtualKeyboard({ onChar, onBackspace }: Props) {
  const [pressed, setPressed] = useState<string | null>(null);

  const press = (key: string, fn: () => void) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fn();
    setPressed(key);
    window.setTimeout(() => setPressed((p) => (p === key ? null : p)), 110);
  };

  const keyClass = (k: string) =>
    `flex h-11 flex-1 max-w-[52px] items-center justify-center rounded-lg text-lg font-bold uppercase shadow-[0_2px_0_rgba(0,0,0,0.5)] transition-all duration-75 sm:h-12 ${
      pressed === k
        ? 'translate-y-0.5 bg-cyan-400 text-slate-950 shadow-none'
        : 'bg-slate-700/70 text-white active:bg-slate-600'
    }`;

  return (
    <div
      className="relative z-30 shrink-0 touch-manipulation border-t border-white/10 bg-slate-950/90 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="mx-auto max-w-2xl space-y-1.5">
        {ROWS.map((row, r) => (
          <div key={r} className={`flex justify-center gap-1 sm:gap-1.5 ${r === 1 ? 'px-[4%]' : ''}`}>
            {row.split('').map((ch) => (
              <button key={ch} onPointerDown={press(ch, () => onChar(ch))} className={keyClass(ch)}>
                {ch}
              </button>
            ))}
            {r === 2 && (
              <button
                onPointerDown={press('⌫', onBackspace)}
                className={`${keyClass('⌫')} max-w-[90px] flex-[1.6] text-base normal-case`}
                aria-label="Release target"
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(VirtualKeyboard);
