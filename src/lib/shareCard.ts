import type { WordEntry } from '../data/decks';
import { isTouchDevice } from './settings';

export type ScoreCardData = {
  result: 'victory' | 'over';
  deckName: string;
  deckIcon: string;
  level: string;
  score: number;
  stage: number;
  stageCount: number;
  destroyed: number;
  missed: number;
  maxCombo: number;
  accuracy: number;
  wpm: number;
  words: WordEntry[];
};

const FONT = '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

async function ensureFonts() {
  try {
    const loads = Promise.all([
      document.fonts.load(`500 26px "Be Vietnam Pro"`),
      document.fonts.load(`800 26px "Be Vietnam Pro"`),
      document.fonts.load(`900 26px "Be Vietnam Pro"`),
    ]);
    await Promise.race([loads, new Promise((r) => setTimeout(r, 1500))]);
  } catch {
    /* fall back to system fonts */
  }
}

export async function renderScoreCard(d: ScoreCardData): Promise<Blob | null> {
  await ensureFonts();
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1e1b4b');
  bg.addColorStop(0.55, '#0b1030');
  bg.addColorStop(1, '#070b1f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(120, 420, 440, 'rgba(192,38,211,0.22)');
  glow(980, 160, 440, 'rgba(34,211,238,0.18)');

  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.7})`;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Header
  ctx.font = `110px ${FONT}`;
  ctx.fillText('🦜', W / 2, 170);
  const titleGrad = ctx.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0);
  titleGrad.addColorStop(0, '#6ee7b7');
  titleGrad.addColorStop(0.5, '#67e8f9');
  titleGrad.addColorStop(1, '#e879f9');
  ctx.fillStyle = titleGrad;
  ctx.font = `900 100px ${FONT}`;
  ctx.fillText('Parroto', W / 2, 285);
  ctx.fillStyle = 'rgba(165,243,252,0.85)';
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText('M Ư A   T Ừ   V Ự N G', W / 2, 335);

  // Result
  const win = d.result === 'victory';
  ctx.font = `900 72px ${FONT}`;
  ctx.fillStyle = win ? '#fde047' : '#fb7185';
  ctx.fillText(win ? '🏆 CHIẾN THẮNG!' : '💥 KẾT THÚC LƯỢT', W / 2, 450);
  ctx.font = `600 34px ${FONT}`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(fit(ctx, `${d.deckIcon} ${d.deckName} · ${d.level}`, W - 160), W / 2, 510);

  // Score panel
  roundRect(ctx, 100, 550, W - 200, 220, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = `800 28px ${FONT}`;
  ctx.fillText('ĐIỂM', W / 2, 610);
  ctx.fillStyle = '#fcd34d';
  ctx.font = `900 120px ${MONO}`;
  ctx.fillText(d.score.toLocaleString('en-US'), W / 2, 730);

  // Stats grid
  const stats: [string, string][] = [
    ['Từ đã bắn', String(d.destroyed)],
    ['Combo cao nhất', `x${d.maxCombo}`],
    ['Độ chính xác', `${d.accuracy}%`],
    ['WPM', String(d.wpm)],
    ['Màn', `${d.stage}/${d.stageCount}`],
    ['Từ bị lọt', String(d.missed)],
  ];
  const cw = (W - 200 - 40) / 3;
  const ch = 120;
  stats.forEach(([label, value], i) => {
    const x = 100 + (i % 3) * (cw + 20);
    const y = 800 + Math.floor(i / 3) * (ch + 20);
    roundRect(ctx, x, y, cw, ch, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 50px ${MONO}`;
    ctx.fillText(value, x + cw / 2, y + 66);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(label.toUpperCase(), x + cw / 2, y + 100);
  });

  // Words learned
  const words = d.words.slice(0, 6);
  if (words.length) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = `800 24px ${FONT}`;
    ctx.fillText(`TỪ VỰNG ĐÃ HỌC (${d.words.length})`, W / 2, 1105);
    ctx.textAlign = 'left';
    words.forEach((wd, i) => {
      const x = 110 + (i % 2) * 440;
      const y = 1155 + Math.floor(i / 2) * 46;
      ctx.fillStyle = '#a5f3fc';
      ctx.font = `800 28px ${MONO}`;
      const label = wd.jp ?? wd.word;
      if (wd.jp) ctx.font = `800 28px "Noto Sans JP", ${FONT}`;
      ctx.fillText(label, x, y);
      const ww = ctx.measureText(label).width;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `500 26px ${FONT}`;
      ctx.fillText(fit(ctx, ` – ${wd.vi}`, 420 - ww), x + ww, y);
    });
    ctx.textAlign = 'center';
  }

  ctx.fillStyle = '#64748b';
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText('Learn English vocabulary by typing · Parroto Word Rain', W / 2, H - 40);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export async function shareScoreImage(
  d: ScoreCardData,
  preRendered?: Blob | null
): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'> {
  // Using a pre-rendered blob keeps navigator.share() inside the click's user activation (needed on iOS).
  const blob = preRendered ?? (await renderScoreCard(d));
  if (!blob) return 'failed';
  const file = new File([blob], 'parroto-word-rain.png', { type: 'image/png' });

  if (isTouchDevice && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Parroto · Word Rain',
        text: `Tôi đạt ${d.score.toLocaleString('en-US')} điểm trong Mưa Từ Vựng Parroto (${d.deckName})!`,
      });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'parroto-word-rain.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return 'downloaded';
}
