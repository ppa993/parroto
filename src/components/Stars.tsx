import { useMemo } from 'react';

export default function Stars({ count = 90 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 3,
        dur: 2 + Math.random() * 3,
      })),
    [count]
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#070b1f_60%)]" />
      <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl" />
      <div className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      {stars.map((s) => (
        <span
          key={s.id}
          className="twinkle absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
