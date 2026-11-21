import { PopupTone } from '../types/studio';

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;
export const FLOOR_Y = 1350;
export const SLOT_X = {
  left: 270,
  center: 540,
  right: 810,
} as const;

export const PALETTE = {
  navyDeep: '#0F1B2D',
  navyMid: '#1B2D4A',
  navyLight: '#24395C',
  cosmosDark: '#0A1322',
  coldSlate: '#3A4A63',
  chalkWhite: '#F5F5F0',
  einsteinYellow: '#FFD60A',
  electricBlue: '#2D9CFF',
  notifPink: '#FF3D81',
  checkGreen: '#17BF63',
  italyGreen: '#1E6B45',
  warmAmber: '#F59E0B',
};

let cachedChalkTexture: HTMLCanvasElement | null = null;

export function getChalkboardTexture(): HTMLCanvasElement {
  if (cachedChalkTexture) return cachedChalkTexture;
  const off = document.createElement('canvas');
  off.width = 540;
  off.height = 960;
  const ctx = off.getContext('2d')!;

  // Base slate chalkboard texture
  ctx.fillStyle = PALETTE.navyDeep;
  ctx.fillRect(0, 0, off.width, off.height);

  // Subtle chalk smudge clouds
  for (let i = 0; i < 28; i++) {
    const x = ((i * 197) % off.width);
    const y = ((i * 313) % off.height);
    const r = 60 + ((i * 53) % 140);
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, 'rgba(245, 245, 240, 0.025)');
    g.addColorStop(1, 'rgba(245, 245, 240, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine chalk grain speckles
  ctx.fillStyle = 'rgba(245, 245, 240, 0.04)';
  for (let i = 0; i < 1600; i++) {
    const px = ((i * 7919) % 539);
    const py = ((i * 6271) % 959);
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  cachedChalkTexture = off;
  return off;
}

export function drawChalkboardBase(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  options: {
    showGrid?: boolean;
    baseColor?: string;
    dimFactor?: number;
  } = {}
) {
  const { showGrid = true, baseColor = PALETTE.navyDeep, dimFactor = 0 } = options;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw cached chalk texture softly
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.drawImage(getChalkboardTexture(), 0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();

  if (showGrid) {
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 245, 240, 0.055)';
    ctx.lineWidth = 1.5;
    const step = 60;
    const driftX = (timeSec * 4) % step;
    const driftY = (timeSec * 2) % step;

    for (let x = -step + driftX; x < CANVAS_W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = -step + driftY; y < CANVAS_H + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Subtle perspective floor grid lines below y = 1350
    ctx.strokeStyle = 'rgba(245, 245, 240, 0.08)';
    ctx.lineWidth = 2;
    const horizonY = FLOOR_Y;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(CANVAS_W, horizonY);
    ctx.stroke();

    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2 + i * 110, horizonY);
      ctx.lineTo(CANVAS_W / 2 + i * 280, CANVAS_H);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (dimFactor > 0) {
    ctx.fillStyle = `rgba(10, 19, 34, ${Math.min(0.7, dimFactor)})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

export function drawChalkDustParticles(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  count = 32,
  warmGoldRatio = 0.35
) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const x = ((seed * 19 + timeSec * (10 + (i % 5) * 4)) % (CANVAS_W + 40)) - 20;
    const y = ((seed * 29 + timeSec * (14 + (i % 4) * 5)) % (CANVAS_H + 40)) - 20;
    const r = 1.6 + (i % 4) * 0.9;
    const twinkle = 0.25 + 0.35 * Math.sin(timeSec * 2.2 + i);
    const isYellow = (i / count) < warmGoldRatio;

    ctx.globalAlpha = Math.max(0.08, twinkle);
    ctx.fillStyle = isYellow ? PALETTE.einsteinYellow : PALETTE.chalkWhite;
    if (isYellow) {
      ctx.shadowColor = PALETTE.einsteinYellow;
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCinematicVignette(
  ctx: CanvasRenderingContext2D,
  pinkAlert = false
) {
  ctx.save();
  const g = ctx.createRadialGradient(
    CANVAS_W / 2,
    CANVAS_H * 0.48,
    CANVAS_W * 0.35,
    CANVAS_W / 2,
    CANVAS_H * 0.5,
    CANVAS_H * 0.72
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(
    1,
    pinkAlert ? 'rgba(255, 61, 129, 0.28)' : 'rgba(6, 12, 24, 0.52)'
  );
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

/** Spring curve for snappy 2.5D pop-up (110% then 100%) */
export function popSpring(elapsedSec: number, durationSec = 0.25): number {
  if (elapsedSec <= 0) return 0;
  if (elapsedSec >= durationSec) return 1;
  const p = elapsedSec / durationSec;
  if (p < 0.65) {
    const t = p / 0.65;
    return 1.12 * (1 - Math.pow(1 - t, 3));
  } else {
    const t = (p - 0.65) / 0.35;
    return 1.12 - 0.12 * t;
  }
}

export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Top-left Episode Pill Header at exact (x=60, y=150) */
export function drawEpisodePillHeader(
  ctx: CanvasRenderingContext2D,
  episodeId: number
) {
  const x = 60;
  const y = 150;
  const label = `EINSTEIN • EPISODE ${episodeId}`;
  ctx.save();
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(label).width;
  const w = Math.max(250, tw + 46);
  const h = 46;

  // Soft shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  drawRoundedRectPath(ctx, x + 3, y + 5, w, h, 23);
  ctx.fill();

  // Dark volumetric pill + subtle white rim
  const pillGrad = ctx.createLinearGradient(x, y, x, y + h);
  pillGrad.addColorStop(0, '#1B2D4A');
  pillGrad.addColorStop(1, '#0B1322');
  ctx.fillStyle = pillGrad;
  ctx.strokeStyle = 'rgba(245, 245, 240, 0.45)';
  ctx.lineWidth = 2.5;
  drawRoundedRectPath(ctx, x, y, w, h, 23);
  ctx.fill();
  ctx.stroke();

  // Glowing gold dot + label
  ctx.fillStyle = PALETTE.einsteinYellow;
  ctx.beginPath();
  ctx.arc(x + 22, y + h / 2, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.chalkWhite;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 36, y + h / 2 + 1);
  ctx.restore();
}

/** Sang Penutur (Narrator) Microphone cleanly below Pill Header (y=204..288) */
export function drawNarratorMic(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  amplitude: number,
  isSilentFreeze: boolean
) {
  const cx = 106;
  const cy = 246;
  const amp = isSilentFreeze ? 0 : Math.min(1, Math.max(0.06, amplitude));

  ctx.save();
  ctx.translate(cx, cy);

  // Soft drop shadow
  ctx.save();
  ctx.translate(3, 6);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer 2.5D sticker circle
  ctx.fillStyle = '#16243B';
  ctx.strokeStyle = PALETTE.chalkWhite;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Subtle rim highlight
  ctx.strokeStyle = 'rgba(255, 214, 10, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 36, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.stroke();

  // Microphone capsule
  const bounce = amp * 2.5 * Math.sin(timeSec * 22);
  ctx.save();
  ctx.translate(0, bounce * 0.4);
  ctx.fillStyle = PALETTE.einsteinYellow;
  ctx.strokeStyle = PALETTE.navyDeep;
  ctx.lineWidth = 2.5;
  drawRoundedRectPath(ctx, -10, -21, 20, 28, 10);
  ctx.fill();
  ctx.stroke();

  // Mic grille lines
  ctx.strokeStyle = PALETTE.navyDeep;
  ctx.lineWidth = 2;
  for (let gy = -14; gy <= -4; gy += 5) {
    ctx.beginPath();
    ctx.moveTo(-6, gy);
    ctx.lineTo(6, gy);
    ctx.stroke();
  }

  // Mic stand U-bracket
  ctx.strokeStyle = PALETTE.chalkWhite;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -3, 15, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(0, 21);
  ctx.moveTo(-9, 21);
  ctx.lineTo(9, 21);
  ctx.stroke();
  ctx.restore();

  // Audio reactive sound waves on right side of mic (x=162..265)
  if (!isSilentFreeze) {
    const bars = 5;
    for (let i = 0; i < bars; i++) {
      const waveH =
        8 +
        amp *
          30 *
          (0.5 + 0.5 * Math.abs(Math.sin(timeSec * 15 + i * 1.15)));
      const bx = 56 + i * 12;
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.shadowColor = PALETTE.einsteinYellow;
      ctx.shadowBlur = 8 * amp;
      drawRoundedRectPath(ctx, bx, -waveH / 2, 7, waveH, 3.5);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = 'rgba(245,245,240,0.48)';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('MUTE', 56, 5);
  }

  ctx.restore();
}

interface SpokenToken {
  word: string;
  weight: number;
}

function parseNarrationTokens(narration: string): SpokenToken[] {
  const parts = narration.split(/(<break[^>]*\/>)/gi);
  const tokens: SpokenToken[] = [];
  let pendingPauseWeight = 0;

  for (const part of parts) {
    const breakMatch = part.match(/time=["']([\d.]+)s?["']/i);
    if (breakMatch) {
      pendingPauseWeight += Math.max(1, parseFloat(breakMatch[1]) * 3.2);
      continue;
    }
    const words = part.trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const baseW = Math.max(1, w.replace(/[^a-zA-Z0-9]/g, '').length * 0.18 + 0.55);
      tokens.push({
        word: w,
        weight: baseW + (i === 0 ? pendingPauseWeight : 0),
      });
      pendingPauseWeight = 0;
    }
  }
  return tokens;
}

/** Dynamic Word-by-Word Karaoke Subtitle at y=1560 (above 250px bottom safe zone) */
export function drawKaraokeSubtitle(
  ctx: CanvasRenderingContext2D,
  narration: string,
  activeTimeSec: number,
  activeDurSec: number,
  isSilentFreeze: boolean
) {
  if (isSilentFreeze) return;
  const tokens = parseNarrationTokens(narration);
  if (tokens.length === 0) return;

  const totalWeight = tokens.reduce((acc, t) => acc + t.weight, 0);
  const progress = Math.min(0.999, Math.max(0, activeTimeSec / Math.max(0.5, activeDurSec)));
  const targetWeight = progress * totalWeight;

  let acc = 0;
  let activeIndex = 0;
  for (let i = 0; i < tokens.length; i++) {
    acc += tokens[i].weight;
    if (acc >= targetWeight) {
      activeIndex = i;
      break;
    }
  }

  // Group into readable 5-word phrases
  const phraseSize = 5;
  const phraseIdx = Math.floor(activeIndex / phraseSize);
  const start = phraseIdx * phraseSize;
  const end = Math.min(tokens.length, start + phraseSize);
  const phraseTokens = tokens.slice(start, end);

  ctx.save();
  ctx.font = '800 38px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';

  const gap = 14;
  const widths = phraseTokens.map((t) => ctx.measureText(t.word).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, phraseTokens.length - 1);

  // Subtle dark pill backdrop behind karaoke phrase for ultra-legibility over busy BGs
  const padX = 28;
  const padY = 18;
  ctx.fillStyle = 'rgba(6, 12, 24, 0.62)';
  drawRoundedRectPath(
    ctx,
    CANVAS_W / 2 - totalW / 2 - padX,
    1560 - 28 - padY * 0.5,
    totalW + padX * 2,
    62,
    18
  );
  ctx.fill();

  let cursorX = CANVAS_W / 2 - totalW / 2;
  const y = 1560;

  for (let i = 0; i < phraseTokens.length; i++) {
    const token = phraseTokens[i];
    const w = widths[i];
    const isActive = start + i === activeIndex;
    const wordCx = cursorX + w / 2;

    ctx.save();
    ctx.translate(wordCx, y);
    if (isActive) {
      ctx.scale(1.07, 1.07);
    }

    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.lineWidth = 10;
    ctx.strokeText(token.word, 0, 0);

    if (isActive) {
      ctx.shadowColor = PALETTE.einsteinYellow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = PALETTE.einsteinYellow;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = PALETTE.chalkWhite;
    }
    ctx.fillText(token.word, 0, 0);
    ctx.restore();

    cursorX += w + gap;
  }

  ctx.restore();
}

/** Pop-up notification in zone y=300..700 */
export function drawPopupBanner(
  ctx: CanvasRenderingContext2D,
  text: string,
  secondaryText: string | undefined,
  tone: PopupTone,
  elapsedSinceAppear: number,
  yCenter = 430
) {
  // Quantize to 24fps snappy pop feel
  const qElapsed = Math.floor(elapsedSinceAppear * 24) / 24;
  const s = popSpring(qElapsed, 0.25);
  if (s <= 0.02) return;

  const toneColors: Record<PopupTone, { bg: string; fg: string; accent: string }> = {
    blue: { bg: PALETTE.electricBlue, fg: '#FFFFFF', accent: '#0C4A6E' },
    pink: { bg: PALETTE.notifPink, fg: '#FFFFFF', accent: '#831843' },
    green: { bg: PALETTE.checkGreen, fg: '#FFFFFF', accent: '#064E3B' },
    yellow: { bg: PALETTE.einsteinYellow, fg: PALETTE.navyDeep, accent: '#92400E' },
    red: { bg: '#EF4444', fg: '#FFFFFF', accent: '#7F1D1D' },
  };
  const colors = toneColors[tone];

  ctx.save();
  ctx.translate(CANVAS_W / 2, yCenter);
  ctx.scale(s, s);

  ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
  const maxW = 780;
  const lines = wrapLines(ctx, text, maxW);
  const hasSec = Boolean(secondaryText);
  const boxW = Math.min(860, Math.max(460, ...lines.map((l) => ctx.measureText(l).width + 90)));
  const boxH = 54 + lines.length * 44 + (hasSec ? 46 : 0);

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  drawRoundedRectPath(ctx, -boxW / 2 + 8, -boxH / 2 + 12, boxW, boxH, 24);
  ctx.fill();

  // Main 2.5D card with thick 6px white sticker outline
  ctx.fillStyle = colors.bg;
  ctx.strokeStyle = PALETTE.chalkWhite;
  ctx.lineWidth = 6;
  drawRoundedRectPath(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 24);
  ctx.fill();
  ctx.stroke();

  // Inner top highlight rim
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 3;
  drawRoundedRectPath(ctx, -boxW / 2 + 8, -boxH / 2 + 8, boxW - 16, boxH - 16, 18);
  ctx.stroke();

  ctx.fillStyle = colors.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let ty = -boxH / 2 + 44;
  for (const line of lines) {
    ctx.fillText(line, 0, ty);
    ty += 44;
  }

  if (secondaryText) {
    ctx.font = '700 26px "DM Sans", sans-serif';
    ctx.fillStyle = tone === 'yellow' ? '#1E293B' : 'rgba(255,255,255,0.92)';
    ctx.fillText(secondaryText, 0, ty + 4);
  }

  ctx.restore();
}

/** Cek Fakta Notification Card at x: 150..930, y: 1315..1480 (cleanly above y=1560 Karaoke!) */
export function drawSpillFaktaCard(
  ctx: CanvasRenderingContext2D,
  factText: string,
  elapsedSinceAppear: number
) {
  const s = popSpring(elapsedSinceAppear, 0.28);
  if (s <= 0.02) return;

  const cardX = 150;
  const cardY = 1315;
  const cardW = 780;
  const cardH = 165;

  ctx.save();
  ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
  ctx.scale(s, s);

  // Soft 2.5D shadow
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  drawRoundedRectPath(ctx, -cardW / 2 + 10, -cardH / 2 + 12, cardW, cardH, 24);
  ctx.fill();

  // Background navy surface + thick white outline
  ctx.fillStyle = '#132238';
  ctx.strokeStyle = PALETTE.chalkWhite;
  ctx.lineWidth = 6;
  drawRoundedRectPath(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  // Green header bar
  ctx.fillStyle = PALETTE.checkGreen;
  drawRoundedRectPath(ctx, -cardW / 2 + 16, -cardH / 2 + 14, 238, 38, 12);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CEK FAKTA ✔', -cardW / 2 + 32, -cardH / 2 + 34);

  // Fact body
  ctx.fillStyle = PALETTE.chalkWhite;
  ctx.font = '700 24px "DM Sans", sans-serif';
  const lines = wrapLines(ctx, factText, cardW - 52).slice(0, 3);
  let ty = -cardH / 2 + 78;
  for (const line of lines) {
    ctx.fillText(line, -cardW / 2 + 24, ty);
    ty += 31;
  }

  ctx.restore();
}

/** Cliffhanger fade-to-black + Red slanted rectangular stamp ("BERSAMBUNG…" / "MUSIM 2: SEGERA") */
export function drawCliffhangerOverlay(
  ctx: CanvasRenderingContext2D,
  freezeElapsedSec: number,
  isSeasonFinale: boolean
) {
  const s = popSpring(freezeElapsedSec, 0.24);
  if (s <= 0.02) return;

  ctx.save();
  // True fade-to-black progression (from dim slate to deep black)
  const fadeAlpha = Math.min(0.92, 0.55 + freezeElapsedSec * 0.45);
  ctx.fillStyle = `rgba(4, 8, 16, ${fadeAlpha})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Red slanted rectangular ink stamp at y = 960
  ctx.save();
  ctx.translate(CANVAS_W / 2, 960);
  ctx.rotate(-0.09);
  ctx.scale(s, s);

  const label = isSeasonFinale ? 'MUSIM 2: SEGERA' : 'BERSAMBUNG…';
  ctx.font = '900 66px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(label).width;
  const bw = tw + 88;
  const bh = 122;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  drawRoundedRectPath(ctx, -bw / 2 + 12, -bh / 2 + 14, bw, bh, 18);
  ctx.fill();

  const stampGrad = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
  stampGrad.addColorStop(0, '#F43F5E');
  stampGrad.addColorStop(1, '#BE123C');
  ctx.fillStyle = stampGrad;
  ctx.strokeStyle = PALETTE.chalkWhite;
  ctx.lineWidth = 7;
  drawRoundedRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 18);
  ctx.fill();
  ctx.stroke();

  // Inner stamp border groove
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3;
  drawRoundedRectPath(ctx, -bw / 2 + 10, -bh / 2 + 10, bw - 20, bh - 20, 12);
  ctx.stroke();

  ctx.fillStyle = PALETTE.chalkWhite;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 3);
  ctx.restore();

  // Bottom prompt "Episode berikutnya ▶" or blinking comment bar
  if (isSeasonFinale) {
    const blink = Math.floor(freezeElapsedSec * 3) % 2 === 0;
    ctx.save();
    ctx.translate(CANVAS_W / 2, 1140);
    ctx.fillStyle = '#16243B';
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 5;
    drawRoundedRectPath(ctx, -330, -40, 660, 80, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(245, 245, 240, 0.78)';
    ctx.font = '600 28px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tulis tokoh sains berikutnya di komentar…' + (blink ? '|' : ''), -300, 0);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(CANVAS_W / 2, 1120);
    ctx.scale(s, s);
    ctx.fillStyle = PALETTE.electricBlue;
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 5;
    drawRoundedRectPath(ctx, -225, -36, 450, 72, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Episode berikutnya ▶', 0, 2);
    ctx.restore();
  }

  ctx.restore();
}

/** TikTok / Reels Safe Zone Preview Guide */
export function drawSafeZoneOverlay(ctx: CanvasRenderingContext2D) {
  ctx.save();

  // Top 150px unsafe area
  ctx.fillStyle = 'rgba(255, 61, 129, 0.18)';
  ctx.fillRect(0, 0, CANVAS_W, 150);

  // Bottom 250px unsafe area (y = 1670..1920)
  ctx.fillRect(0, 1670, CANVAS_W, 250);

  // Right TikTok/Reels icons rail mock
  ctx.fillStyle = 'rgba(255, 61, 129, 0.12)';
  ctx.fillRect(940, 1020, 140, 650);

  // Safe action boundary box
  ctx.strokeStyle = '#FF3D81';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(24, 150, CANVAS_W - 48, 1520);

  // Character floor line y = 1350
  ctx.strokeStyle = '#17BF63';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(CANVAS_W, FLOOR_Y);
  ctx.stroke();

  // Column guides x = 270, 540, 810
  ctx.strokeStyle = 'rgba(45, 156, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  for (const cx of [SLOT_X.left, SLOT_X.center, SLOT_X.right]) {
    ctx.beginPath();
    ctx.moveTo(cx, 150);
    ctx.lineTo(cx, 1670);
    ctx.stroke();
  }

  // Labels
  ctx.setLineDash([]);
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FF3D81';
  ctx.fillText('SAFE TOP y=150', 36, 134);
  ctx.fillText('SAFE BOTTOM y=1670 (250px TikTok/Reels)', 36, 1705);
  ctx.fillStyle = '#17BF63';
  ctx.fillText('FLOOR y=1350', 36, FLOOR_Y - 12);
  ctx.fillStyle = '#2D9CFF';
  ctx.fillText('x=270', 235, 1650);
  ctx.fillText('x=540', 505, 1650);
  ctx.fillText('x=810', 775, 1650);

  ctx.restore();
}

/** Glitch 6-frame or Swipe-Up 12-frame transition overlay */
export function drawTransitionOverlay(
  ctx: CanvasRenderingContext2D,
  type: 'none' | 'glitch' | 'swipe-up',
  sceneElapsedSec: number
) {
  if (type === 'none') return;

  if (type === 'glitch' && sceneElapsedSec < 0.25) {
    const p = 1 - sceneElapsedSec / 0.25;
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const y = ((i * 213 + Math.floor(sceneElapsedSec * 60) * 97) % CANVAS_H);
      const h = 24 + (i % 4) * 28;
      ctx.fillStyle = i % 2 === 0 ? `rgba(45, 156, 255, ${0.42 * p})` : `rgba(255, 61, 129, ${0.38 * p})`;
      ctx.fillRect(0, y, CANVAS_W, h);
    }
    ctx.restore();
  } else if (type === 'swipe-up' && sceneElapsedSec < 0.4) {
    const p = sceneElapsedSec / 0.4;
    const barY = CANVAS_H * (1 - p);
    ctx.save();
    const grad = ctx.createLinearGradient(0, barY - 120, 0, barY + 120);
    grad.addColorStop(0, 'rgba(255, 214, 10, 0)');
    grad.addColorStop(0.5, `rgba(255, 214, 10, ${0.35 * (1 - p)})`);
    grad.addColorStop(1, 'rgba(15, 27, 45, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, barY - 120, CANVAS_W, 240);
    ctx.restore();
  }
}
