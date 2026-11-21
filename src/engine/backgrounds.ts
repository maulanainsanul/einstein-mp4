import { BackgroundId } from '../types/studio';
import {
  CANVAS_H,
  CANVAS_W,
  FLOOR_Y,
  PALETTE,
  drawRoundedRectPath,
} from './chalkAndFx';

export interface BgRenderContext {
  bgId: BackgroundId;
  variant: string;
  timeSec: number;
  sceneProgress: number; // 0..1 within scene
  splitScreen?: boolean;
  splitLeftLabel?: string;
  splitRightLabel?: string;
  chalkMotif?: string;
  camTx?: number;
  camTy?: number;
}

/** Colorful Vintage Heritage Interior Wallpaper + Oak Wainscoting + Moldings */
function drawVintageRoomBase(
  ctx: CanvasRenderingContext2D,
  opts: {
    wallTop: string;
    wallBottom: string;
    stripeColor: string;
    wainscotWood: string;
    wainscotTrim: string;
    floorTop: string;
    floorBottom: string;
    rugColor?: string;
    rugBorder?: string;
  }
) {
  // 1. Rich period wall gradient
  const wg = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  wg.addColorStop(0, opts.wallTop);
  wg.addColorStop(1, opts.wallBottom);
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

  // 2. Classic Belle Epoque vertical damask stripes
  ctx.save();
  ctx.fillStyle = opts.stripeColor;
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.fillRect(x, 0, 22, FLOOR_Y);
  }
  // Crown cornice top trim
  ctx.fillStyle = opts.wainscotTrim;
  ctx.fillRect(0, 0, CANVAS_W, 46);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 46, CANVAS_W, 8);
  ctx.restore();

  // 3. Carved Oak / Mahogany Wainscoting below y = 960
  const wY = 960;
  ctx.fillStyle = opts.wainscotWood;
  ctx.fillRect(0, wY, CANVAS_W, FLOOR_Y - wY);
  ctx.fillStyle = opts.wainscotTrim;
  ctx.fillRect(0, wY - 14, CANVAS_W, 18);

  // Wainscot inset panels
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 4;
  for (let px = 40; px < CANVAS_W - 80; px += 170) {
    drawRoundedRectPath(ctx, px, wY + 26, 130, FLOOR_Y - wY - 56, 8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    drawRoundedRectPath(ctx, px + 6, wY + 32, 118, FLOOR_Y - wY - 68, 6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  }

  // 4. Warm polished vintage hardwood plank floor
  const fg = ctx.createLinearGradient(0, FLOOR_Y, 0, CANVAS_H);
  fg.addColorStop(0, opts.floorTop);
  fg.addColorStop(1, opts.floorBottom);
  ctx.fillStyle = fg;
  ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);

  ctx.strokeStyle = 'rgba(30, 15, 5, 0.36)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(CANVAS_W, FLOOR_Y);
  ctx.stroke();

  for (let y = FLOOR_Y + 68; y < CANVAS_H; y += 78) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  // Subtle perspective seams
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2 + i * 130, FLOOR_Y);
    ctx.lineTo(CANVAS_W / 2 + i * 260, CANVAS_H);
    ctx.stroke();
  }

  // 5. Optional ornate vintage Persian carpet runner
  if (opts.rugColor) {
    ctx.save();
    ctx.fillStyle = opts.rugColor;
    ctx.beginPath();
    ctx.moveTo(140, FLOOR_Y + 26);
    ctx.lineTo(940, FLOOR_Y + 26);
    ctx.lineTo(1020, FLOOR_Y + 190);
    ctx.lineTo(60, FLOOR_Y + 190);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = opts.rugBorder ?? '#F59E0B';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.restore();
  }
}

function drawFramedPortrait(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor: string
) {
  ctx.save();
  // Gilded brass antique frame
  ctx.fillStyle = '#B45309';
  drawRoundedRectPath(ctx, x - 12, y - 12, w + 24, h + 24, 10);
  ctx.fill();
  ctx.strokeStyle = '#FCD34D';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner vintage painting canvas
  const pg = ctx.createLinearGradient(x, y, x, y + h);
  pg.addColorStop(0, '#FEF3C7');
  pg.addColorStop(1, accentColor);
  ctx.fillStyle = pg;
  ctx.fillRect(x, y, w, h);

  // Stylized vintage landscape silhouette inside painting
  ctx.fillStyle = 'rgba(40, 30, 20, 0.35)';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.35, y + h * 0.48);
  ctx.lineTo(x + w * 0.68, y + h * 0.65);
  ctx.lineTo(x + w, y + h * 0.42);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVintageWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    skyTop?: string;
    skyBottom?: string;
    moon?: boolean;
    rain?: boolean;
    sun?: boolean;
    roofer?: boolean;
    sunset?: boolean;
    curtainColor?: string;
    timeSec?: number;
  } = {}
) {
  const t = opts.timeSec ?? 0;
  ctx.save();

  // Sky gradient inside window
  const skyG = ctx.createLinearGradient(x, y, x, y + h);
  if (opts.sunset) {
    skyG.addColorStop(0, '#7C2D12');
    skyG.addColorStop(0.55, '#EA580C');
    skyG.addColorStop(1, '#FBBF24');
  } else if (opts.sun) {
    skyG.addColorStop(0, '#38BDF8');
    skyG.addColorStop(1, '#BAE6FD');
  } else {
    skyG.addColorStop(0, opts.skyTop ?? '#1E1B4B');
    skyG.addColorStop(1, opts.skyBottom ?? '#312E81');
  }

  ctx.fillStyle = skyG;
  drawRoundedRectPath(ctx, x, y, w, h, 18);
  ctx.fill();

  ctx.save();
  drawRoundedRectPath(ctx, x, y, w, h, 18);
  ctx.clip();

  if (opts.sun) {
    // Warm sunlit clouds + golden rays
    ctx.fillStyle = 'rgba(255, 243, 176, 0.85)';
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.28, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const cx = x + ((t * 14) % (w + 60)) - 30;
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.45, 24, 0, Math.PI * 2);
    ctx.arc(cx + 22, y + h * 0.42, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.moon) {
    // Twinkling stars + crescent moon
    ctx.fillStyle = '#FEF08A';
    for (let s = 0; s < 8; s++) {
      ctx.beginPath();
      ctx.arc(x + ((s * 53) % w), y + ((s * 39) % (h * 0.7)), 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.26, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(x + w * 0.79, y + h * 0.22, 19, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.rain) {
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 26; i++) {
      const rx = x + ((i * 37) % w);
      const ry = y + ((i * 41 + t * 290) % h);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 20);
      ctx.stroke();
    }
  }

  if (opts.roofer) {
    // Colorful terracotta European roofs outside
    ctx.fillStyle = '#9A3412';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + h);
    ctx.lineTo(x + w * 0.5, y + h * 0.45);
    ctx.lineTo(x + w + 10, y + h * 0.75);
    ctx.lineTo(x + w + 10, y + h);
    ctx.closePath();
    ctx.fill();
  }

  // Sunbeam shaft on floor/wall
  if (opts.sun || opts.sunset) {
    ctx.restore();
    ctx.save();
    const beamG = ctx.createLinearGradient(x, y, x + w * 1.4, FLOOR_Y);
    beamG.addColorStop(0, opts.sunset ? 'rgba(251, 146, 60, 0.22)' : 'rgba(254, 240, 138, 0.18)');
    beamG.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamG;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 1.65, FLOOR_Y);
    ctx.lineTo(x + w * 0.35, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Ornate carved oak window frame + mullions
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 12;
  drawRoundedRectPath(ctx, x, y, w, h, 18);
  ctx.stroke();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 3;
  drawRoundedRectPath(ctx, x - 4, y - 4, w + 8, h + 8, 20);
  ctx.stroke();

  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.stroke();

  // Period fabric drapes on left and right edges
  if (opts.curtainColor) {
    ctx.fillStyle = opts.curtainColor;
    // Left curtain
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 10);
    ctx.lineTo(x + 42, y - 10);
    ctx.quadraticCurveTo(x + 12, y + h * 0.5, x + 28, y + h + 18);
    ctx.lineTo(x - 16, y + h + 18);
    ctx.closePath();
    ctx.fill();
    // Right curtain
    ctx.beginPath();
    ctx.moveTo(x + w + 16, y - 10);
    ctx.lineTo(x + w - 42, y - 10);
    ctx.quadraticCurveTo(x + w - 12, y + h * 0.5, x + w - 28, y + h + 18);
    ctx.lineTo(x + w + 16, y + h + 18);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawLampGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius = 300,
  alpha = 0.28
) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 8, x, y, radius);
  g.addColorStop(0, `rgba(255, 224, 102, ${alpha})`);
  g.addColorStop(0.55, `rgba(251, 146, 60, ${alpha * 0.42})`);
  g.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBrassChandelier(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  // Shade & brass dome
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(cx - 72, cy + 44);
  ctx.lineTo(cx + 72, cy + 44);
  ctx.lineTo(cx + 38, cy);
  ctx.lineTo(cx - 38, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Warm bulb
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(cx, cy + 48, 16, 0, Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawWoodenTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  clothColor?: string
) {
  ctx.save();
  ctx.fillStyle = '#5C3018';
  ctx.fillRect(x + 28, y + 24, 24, h - 24);
  ctx.fillRect(x + w - 52, y + 24, 24, h - 24);
  ctx.fillStyle = '#783F21';
  drawRoundedRectPath(ctx, x, y, w, 28, 8);
  ctx.fill();
  ctx.strokeStyle = '#9A5B32';
  ctx.lineWidth = 3;
  ctx.stroke();

  if (clothColor) {
    ctx.fillStyle = clothColor;
    drawRoundedRectPath(ctx, x + w * 0.14, y - 4, w * 0.72, 22, 6);
    ctx.fill();
  }
  ctx.restore();
}

/** L-01: Rumah dan Kamar (Colorful 1879–1919 Heritage Homes) */
function renderL01(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const v = info.variant;

  if (v === 'kamar-bersalin') {
    // Sunny cream & dusty rose vintage Ulm nursery
    drawVintageRoomBase(ctx, {
      wallTop: '#5E3A3E',
      wallBottom: '#8C5855',
      stripeColor: 'rgba(253, 230, 138, 0.08)',
      wainscotWood: '#5A3219',
      wainscotTrim: '#92400E',
      floorTop: '#7C4828',
      floorBottom: '#422210',
      rugColor: '#9F1239',
      rugBorder: '#FBBF24',
    });
    drawVintageWindow(ctx, 85, 340, 225, 270, {
      sun: true,
      curtainColor: '#FDE68A',
      timeSec: info.timeSec,
    });
    drawFramedPortrait(ctx, 455, 380, 160, 190, '#10B981');
    drawLampGlow(ctx, 840, 390, 340, 0.34);
    drawBrassChandelier(ctx, 840, 330);

    // Bed right with coral quilt
    ctx.fillStyle = '#5A2E16';
    drawRoundedRectPath(ctx, 660, 1100, 350, 250, 18);
    ctx.fill();
    ctx.fillStyle = '#E11D48';
    drawRoundedRectPath(ctx, 680, 1150, 310, 145, 16);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    drawRoundedRectPath(ctx, 875, 1118, 95, 48, 12);
    ctx.fill();

    // Carved wooden cradle center
    ctx.fillStyle = '#78350F';
    drawRoundedRectPath(ctx, 415, 1200, 250, 130, 30);
    ctx.fill();
    ctx.fillStyle = '#BAE6FD';
    drawRoundedRectPath(ctx, 435, 1215, 210, 88, 20);
    ctx.fill();
  } else if (v === 'ruang-makan-munich' || v === 'ruang-makan-malam') {
    // Rich Victorian burgundy & oak Munich dining hall
    drawVintageRoomBase(ctx, {
      wallTop: '#4C1D24',
      wallBottom: '#7F1D1D',
      stripeColor: 'rgba(251, 191, 36, 0.08)',
      wainscotWood: '#452312',
      wainscotTrim: '#B45309',
      floorTop: '#6E3B1F',
      floorBottom: '#3D1E0E',
      rugColor: '#1E3A8A',
      rugBorder: '#F59E0B',
    });
    drawVintageWindow(ctx, 85, 350, 220, 250, {
      moon: true,
      curtainColor: '#B91C1C',
      timeSec: info.timeSec,
    });
    drawFramedPortrait(ctx, 780, 390, 170, 200, '#D97706');
    drawLampGlow(ctx, 540, 360, 380, 0.34);
    drawBrassChandelier(ctx, 540, 310);

    // Grand mahogany upright piano right with music stand & sheet music
    ctx.fillStyle = '#2A140B';
    drawRoundedRectPath(ctx, 825, 1000, 235, 350, 12);
    ctx.fill();
    ctx.fillStyle = '#F5F5F0';
    ctx.fillRect(855, 1020, 110, 62);
    ctx.fillStyle = '#FEF9C3';
    ctx.fillRect(835, 1140, 180, 24);
    ctx.fillStyle = '#1E293B';
    for (let k = 842; k < 1005; k += 18) {
      ctx.fillRect(k, 1140, 8, 14);
    }

    // Ornate dining table with warm ceramic plates & flickering brass candlestick
    drawWoodenTable(ctx, 180, 1185, 650, 165, '#FDE68A');
    for (const px of [310, 505, 680]) {
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.ellipse(px, 1184, 34, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#D97706';
    ctx.fillRect(512, 1140, 14, 42);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.ellipse(519, 1130 + Math.sin(info.timeSec * 8) * 2, 7, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (v === 'kamar-anak') {
    // Cheerful sky-blue & buttercream 1880s kids bedroom
    drawVintageRoomBase(ctx, {
      wallTop: '#1E4E68',
      wallBottom: '#2B6CB0',
      stripeColor: 'rgba(255, 255, 255, 0.08)',
      wainscotWood: '#78350F',
      wainscotTrim: '#F59E0B',
      floorTop: '#9A5B32',
      floorBottom: '#5C3018',
      rugColor: '#EA580C',
      rugBorder: '#FEF08A',
    });
    drawVintageWindow(ctx, 85, 350, 210, 240, {
      sun: true,
      curtainColor: '#38BDF8',
      timeSec: info.timeSec,
    });
    drawFramedPortrait(ctx, 640, 420, 180, 150, '#F59E0B');

    // Kid bed left (green & gold) + cradle right
    ctx.fillStyle = '#78350F';
    drawRoundedRectPath(ctx, 80, 1160, 310, 190, 16);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    drawRoundedRectPath(ctx, 95, 1190, 280, 110, 14);
    ctx.fill();

    ctx.fillStyle = '#92400E';
    drawRoundedRectPath(ctx, 710, 1205, 240, 135, 24);
    ctx.fill();
    ctx.fillStyle = '#F472B6';
    drawRoundedRectPath(ctx, 725, 1220, 210, 88, 16);
    ctx.fill();

    // Colorful painted wooden blocks on floor
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(455, 1306, 42, 44);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(504, 1316, 38, 34);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(475, 1272, 34, 34);
  } else if (v === 'kamar-sakit') {
    // Cozy warm olive-ochre heritage room with glowing brass oil lamp
    drawVintageRoomBase(ctx, {
      wallTop: '#2D3A27',
      wallBottom: '#4A5D3F',
      stripeColor: 'rgba(253, 224, 71, 0.06)',
      wainscotWood: '#4A2814',
      wainscotTrim: '#B45309',
      floorTop: '#6B3B1E',
      floorBottom: '#3A1E0E',
      rugColor: '#991B1B',
      rugBorder: '#F59E0B',
    });
    drawLampGlow(ctx, 890, 1080, 390, 0.36);

    // Wooden bed with red/gold tartan blanket
    ctx.fillStyle = '#5C3018';
    drawRoundedRectPath(ctx, 210, 1100, 620, 250, 20);
    ctx.fill();
    ctx.fillStyle = '#B91C1C';
    drawRoundedRectPath(ctx, 225, 1145, 590, 165, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
    ctx.lineWidth = 4;
    for (let bx = 260; bx < 790; bx += 55) {
      ctx.beginPath();
      ctx.moveTo(bx, 1150);
      ctx.lineTo(bx, 1305);
      ctx.stroke();
    }
    // Nightstand + brass oil lamp
    ctx.fillStyle = '#6B3719';
    ctx.fillRect(845, 1170, 145, 180);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(896, 1130, 42, 40);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(917, 1112, 20, 0, Math.PI * 2);
    ctx.fill();
  } else if (v === 'kamar-belajar-malam') {
    // Forest emerald & warm amber scholar study
    drawVintageRoomBase(ctx, {
      wallTop: '#13382E',
      wallBottom: '#1D4D40',
      stripeColor: 'rgba(251, 191, 36, 0.07)',
      wainscotWood: '#4A2814',
      wainscotTrim: '#D97706',
      floorTop: '#6E3B1F',
      floorBottom: '#3A1E0E',
    });
    drawVintageWindow(ctx, 760, 360, 230, 270, {
      moon: true,
      curtainColor: '#991B1B',
      timeSec: info.timeSec,
    });
    // Wall chalkboard with glowing Euclid triangles & calculus curve
    ctx.fillStyle = '#78350F';
    ctx.fillRect(140, 410, 520, 320);
    ctx.fillStyle = '#14532D';
    ctx.fillRect(154, 424, 492, 292);
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(210, 640);
    ctx.lineTo(350, 640);
    ctx.lineTo(210, 490);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(410, 640);
    ctx.quadraticCurveTo(490, 470, 595, 520);
    ctx.stroke();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('a² + b² = c²   ∫ y dx', 210, 685);

    drawLampGlow(ctx, 320, 1020, 380, 0.36);
    drawWoodenTable(ctx, 190, 1170, 680, 180);
    // Green banker's lamp on desk
    ctx.fillStyle = '#10B981';
    drawRoundedRectPath(ctx, 250, 1110, 72, 32, 12);
    ctx.fill();
    ctx.fillStyle = '#D97706';
    ctx.fillRect(280, 1142, 12, 28);
  } else if (v === 'kamar-kos-munich') {
    // Cool teal-slate rainy Munich boarding attic with warm brick chimney
    drawVintageRoomBase(ctx, {
      wallTop: '#243B53',
      wallBottom: '#334E68',
      stripeColor: 'rgba(255,255,255,0.05)',
      wainscotWood: '#4E342E',
      wainscotTrim: '#8D6E63',
      floorTop: '#5D4037',
      floorBottom: '#2E1E1A',
    });
    drawVintageWindow(ctx, 730, 350, 260, 320, {
      rain: true,
      curtainColor: '#B45309',
      timeSec: info.timeSec,
    });
    ctx.fillStyle = '#6B3719';
    drawRoundedRectPath(ctx, 80, 1185, 320, 165, 14);
    ctx.fill();
    ctx.fillStyle = '#60A5FA';
    drawRoundedRectPath(ctx, 95, 1210, 290, 105, 12);
    ctx.fill();
    // Leather suitcase
    ctx.fillStyle = '#92400E';
    drawRoundedRectPath(ctx, 480, 1265, 155, 85, 10);
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 4;
    ctx.strokeRect(505, 1265, 105, 85);
  } else if (v === 'ruang-tamu-meja-kayu') {
    // Rich Prussian blue & ochre European parlor
    drawVintageRoomBase(ctx, {
      wallTop: '#1E3A5F',
      wallBottom: '#2C5282',
      stripeColor: 'rgba(253, 224, 71, 0.06)',
      wainscotWood: '#5C3018',
      wainscotTrim: '#D97706',
      floorTop: '#7C4828',
      floorBottom: '#422210',
      rugColor: '#7F1D1D',
      rugBorder: '#FBBF24',
    });
    drawVintageWindow(ctx, 85, 350, 215, 250, {
      moon: true,
      curtainColor: '#D97706',
      timeSec: info.timeSec,
    });
    drawLampGlow(ctx, 540, 960, 340, 0.25);
    drawWoodenTable(ctx, 180, 1170, 720, 180);
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(460, 1142, 160, 28);
  }

}

/** L-02: Sekolah dan Aula Ujian (Colorful Historic Bavarian & Swiss Schools) */
function renderL02(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const v = info.variant;

  if (v === 'kelas-munich') {
    // Warm cream plaster upper + sage-green & oak lower wall + hunter-green chalkboard
    drawVintageRoomBase(ctx, {
      wallTop: '#52412C',
      wallBottom: '#785E3D',
      stripeColor: 'rgba(254, 243, 199, 0.07)',
      wainscotWood: '#4A2B16',
      wainscotTrim: '#B45309',
      floorTop: '#784421',
      floorBottom: '#42220F',
    });
    drawVintageWindow(ctx, 55, 360, 145, 280, {
      sun: true,
      curtainColor: '#991B1B',
      timeSec: info.timeSec,
    });

    // Classic hunter-green chalkboard in oak frame
    ctx.fillStyle = '#78350F';
    ctx.fillRect(215, 405, 575, 345);
    ctx.fillStyle = '#14532D';
    ctx.fillRect(235, 425, 535, 305);

    // Ornate Brass Wall Clock
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(890, 455, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(890, 455, 46, 0, Math.PI * 2);
    ctx.fill();
    const secAngle = (info.timeSec * 0.6) % (Math.PI * 2);
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(890, 455);
    ctx.lineTo(890 + Math.cos(secAngle) * 34, 455 + Math.sin(secAngle) * 34);
    ctx.stroke();

    // Wooden door right opening into bright sunlight
    const doorOpen = info.sceneProgress > 0.78 ? (info.sceneProgress - 0.78) / 0.22 : 0;
    ctx.fillStyle = '#5C3018';
    ctx.fillRect(860, 780, 160, 570);
    if (doorOpen > 0) {
      ctx.fillStyle = `rgba(254, 249, 195, ${0.48 + 0.5 * doorOpen})`;
      ctx.fillRect(860, 780, 26 + 96 * doorOpen, 570);
    }

    // Oak student desks
    for (let dx = 110; dx <= 680; dx += 260) {
      drawWoodenTable(ctx, dx, 1175, 190, 175);
    }
  } else if (v === 'ruang-kepala-sekolah') {
    // Rich Burgundy & Mahogany Principal Study with Colorful Library Books
    drawVintageRoomBase(ctx, {
      wallTop: '#45121B',
      wallBottom: '#6B1D2B',
      stripeColor: 'rgba(251, 191, 36, 0.08)',
      wainscotWood: '#3E1C0C',
      wainscotTrim: '#D97706',
      floorTop: '#5C2E14',
      floorBottom: '#33170A',
      rugColor: '#991B1B',
      rugBorder: '#FBBF24',
    });

    // Tall mahogany bookcase with colorful leather spines
    ctx.fillStyle = '#4A2511';
    ctx.fillRect(95, 380, 320, 790);
    const spineColors = ['#B91C1C', '#1D4ED8', '#047857', '#D97706', '#7C3AED'];
    for (let row = 0; row < 5; row++) {
      const sy = 420 + row * 140;
      ctx.fillStyle = '#2B1409';
      ctx.fillRect(110, sy + 95, 290, 14);
      for (let b = 0; b < 9; b++) {
        ctx.fillStyle = spineColors[(row * 3 + b) % spineColors.length];
        ctx.fillRect(118 + b * 31, sy + 18 + ((b + row) % 3) * 8, 24, 78 - ((b + row) % 3) * 8);
      }
    }

    drawFramedPortrait(ctx, 640, 410, 220, 270, '#B45309');
    drawWoodenTable(ctx, 210, 1165, 670, 185);
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(490, 1142, 115, 26);
  } else {
    // Zurich Grand Neoclassical Limestone & Stained-Glass Exam Hall
    drawVintageRoomBase(ctx, {
      wallTop: '#57534E',
      wallBottom: '#78716C',
      stripeColor: 'rgba(254, 243, 199, 0.08)',
      wainscotWood: '#5C3018',
      wainscotTrim: '#D97706',
      floorTop: '#8C5835',
      floorBottom: '#4A2814',
    });
    // Stained-glass arches
    const glassColors = ['rgba(56, 189, 248, 0.35)', 'rgba(251, 191, 36, 0.35)', 'rgba(244, 63, 94, 0.35)'];
    for (let i = 0; i < 3; i++) {
      const rx = 200 + i * 340;
      ctx.fillStyle = glassColors[i];
      ctx.beginPath();
      ctx.arc(rx, 660, 145, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    // Hall clock
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(540, 415, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.arc(540, 415, 54, 0, Math.PI * 2);
    ctx.fill();
    for (let dx = 120; dx <= 750; dx += 315) {
      drawWoodenTable(ctx, dx, 1170, 210, 180);
    }
  }
}

/** L-03: Alam Terbuka Eropa 1895 (Vibrant Alpine & Sunlit Meadows + Vintage Steam Train) */
function renderL03(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const isAarau = info.variant === 'taman-aarau';
  const t = info.timeSec;

  // Golden vintage European afternoon sky gradient
  const skyG = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  if (isAarau) {
    skyG.addColorStop(0, '#0284C7');
    skyG.addColorStop(0.65, '#38BDF8');
    skyG.addColorStop(1, '#BAE6FD');
  } else {
    skyG.addColorStop(0, '#1D4ED8');
    skyG.addColorStop(0.55, '#F59E0B');
    skyG.addColorStop(1, '#FDE68A');
  }
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Warm sun & golden halo
  drawLampGlow(ctx, 220, 320, 290, 0.48);
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(220, 320, 68, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy sunlit painted clouds
  ctx.fillStyle = 'rgba(255, 250, 240, 0.9)';
  for (let i = 0; i < 3; i++) {
    const cx = ((180 + i * 380 + t * (18 + i * 5)) % (CANVAS_W + 240)) - 120;
    const cy = 270 + i * 95;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.arc(cx + 42, cy - 12, 52, 0, Math.PI * 2);
    ctx.arc(cx + 88, cy, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  const camX = info.camTx ?? 0;
  const camY = info.camTy ?? 0;

  if (!isAarau) {
    const p1 = (t * 8) % 240 - camX * 0.45;
    const p2 = (t * 16) % 240 - camX * 0.25;
    // Far lavender-indigo Italian Alps with snow caps
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.moveTo(-240, FLOOR_Y);
    ctx.lineTo(180 - p1 * 0.2, 680 - camY * 0.25);
    ctx.lineTo(540 - p1 * 0.2, 950 - camY * 0.25);
    ctx.lineTo(860 - p1 * 0.2, 650 - camY * 0.25);
    ctx.lineTo(1320, FLOOR_Y);
    ctx.closePath();
    ctx.fill();

    // Mid teal-pine hills
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.moveTo(-160, FLOOR_Y);
    ctx.lineTo(290 - p2 * 0.35, 860 - camY * 0.15);
    ctx.lineTo(680 - p2 * 0.35, 1080 - camY * 0.15);
    ctx.lineTo(1040 - p2 * 0.35, 840 - camY * 0.15);
    ctx.lineTo(1280, FLOOR_Y);
    ctx.closePath();
    ctx.fill();

    // Near lush emerald hills & cypress trees
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.quadraticCurveTo(280, 1120, 580, 1245);
    ctx.quadraticCurveTo(860, 1135, CANVAS_W, 1275);
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.lineTo(0, CANVAS_H);
    ctx.closePath();
    ctx.fill();

    // Vintage crimson-and-brass steam train across viaduct!
    const trainX = ((t * 68) % (CANVAS_W + 340)) - 170;
    ctx.fillStyle = '#B91C1C';
    drawRoundedRectPath(ctx, trainX, 1148, 128, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(trainX + 100, 1130, 18, 22);
    ctx.fillStyle = '#1E293B';
    drawRoundedRectPath(ctx, trainX - 90, 1152, 82, 30, 6);
    ctx.fill();
    // Puffs of white steam
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      ctx.arc(trainX + 95 - s * 22, 1118 - s * 10, 10 + s * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wildflower dots in meadow
    const flowerC = ['#FACC15', '#FB7185', '#FFFFFF'];
    for (let f = 0; f < 16; f++) {
      ctx.fillStyle = flowerC[f % 3];
      ctx.beginPath();
      ctx.arc((f * 97) % CANVAS_W, 1380 + ((f * 61) % 340), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Aarau verdant Swiss hillside + colorful flower park
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.moveTo(0, 1220);
    ctx.quadraticCurveTo(320, 1110, 620, 1210);
    ctx.quadraticCurveTo(880, 1130, CANVAS_W, 1220);
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.lineTo(0, CANVAS_H);
    ctx.closePath();
    ctx.fill();

    // Blossoming heritage park trees
    for (const [tx, ty, tr, col] of [
      [150, 1030, 92, '#15803D'],
      [930, 1010, 96, '#0D9488'],
    ] as const) {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(tx - 18, ty, 36, 220);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }

    if (info.sceneProgress > 0.6) {
      const p = Math.min(1, (info.sceneProgress - 0.6) / 0.3);
      ctx.save();
      ctx.strokeStyle = PALETTE.einsteinYellow;
      ctx.lineWidth = 9;
      ctx.shadowColor = PALETTE.einsteinYellow;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(540, 560, 65, -0.7, -0.7 - Math.PI * 1.45 * p, true);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** L-04: ETH dan Kafe Zurich 1896–1902 */
function renderL04(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const v = info.variant;

  if (v === 'kafe-zurich') {
    // Cozy warm ochre Belle Epoque Viennese/Swiss Café with red awning & marble tables
    drawVintageRoomBase(ctx, {
      wallTop: '#5C3317',
      wallBottom: '#8C4E27',
      stripeColor: 'rgba(253, 224, 71, 0.08)',
      wainscotWood: '#45220E',
      wainscotTrim: '#D97706',
      floorTop: '#7C4828',
      floorBottom: '#3D1E0E',
      rugColor: '#B91C1C',
      rugBorder: '#FDE68A',
    });
    // Striped cafe awning banner upper
    for (let ax = 0; ax < CANVAS_W; ax += 90) {
      ctx.fillStyle = (ax / 90) % 2 === 0 ? '#DC2626' : '#FEF3C7';
      ctx.fillRect(ax, 270, 90, 74);
    }
    drawLampGlow(ctx, 540, 520, 440, 0.32);

    // Marble bistro tables + animated steam
    drawWoodenTable(ctx, 160, 1170, 230, 180, '#FEF9C3');
    drawWoodenTable(ctx, 690, 1170, 230, 180, '#FEF9C3');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 3.5;
    for (let s = 0; s < 3; s++) {
      const sx = 240 + s * 22;
      const sy = 1130 - ((info.timeSec * 36 + s * 18) % 65);
      ctx.beginPath();
      ctx.moveTo(sx, sy + 24);
      ctx.quadraticCurveTo(sx + 10, sy + 12, sx, sy);
      ctx.stroke();
    }
  } else if (v === 'gerbang-eth') {
    // Warm sunlit sandstone neoclassical ETH portal & golden gas streetlamps
    const skyG = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    skyG.addColorStop(0, '#1E40AF');
    skyG.addColorStop(1, '#93C5FD');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

    ctx.fillStyle = '#D6D3D1';
    ctx.fillRect(140, 560, 800, 790);
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(540, 920, 190, Math.PI, 0);
    ctx.lineTo(730, 1350);
    ctx.lineTo(350, 1350);
    ctx.closePath();
    ctx.fill();

    // Brass ETH signboard
    ctx.fillStyle = '#78350F';
    ctx.fillRect(320, 470, 440, 74);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 4;
    ctx.strokeRect(320, 470, 440, 74);
    ctx.fillStyle = '#FEF3C7';
    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ETH ZURICH', 540, 518);

    // Cobblestone terrace & warm glowing café corner right
    ctx.fillStyle = '#57534E';
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
    drawLampGlow(ctx, 940, 1140, 210, 0.45);
    ctx.fillStyle = '#F59E0B';
    drawRoundedRectPath(ctx, 880, 1080, 140, 130, 14);
    ctx.fill();
  } else if (v === 'administrasi-eth') {
    drawVintageRoomBase(ctx, {
      wallTop: '#2E435E',
      wallBottom: '#426187',
      stripeColor: 'rgba(255,255,255,0.06)',
      wainscotWood: '#5C3018',
      wainscotTrim: '#D97706',
      floorTop: '#784421',
      floorBottom: '#3E200F',
    });
    // Cork & brass bulletin board center
    ctx.fillStyle = '#78350F';
    drawRoundedRectPath(ctx, 196, 406, 688, 468, 18);
    ctx.fill();
    ctx.fillStyle = '#B45309';
    drawRoundedRectPath(ctx, 214, 424, 652, 432, 14);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(246, 448, 588, 384);
    ctx.fillStyle = '#1E293B';
    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HASIL UJIAN MASUK ETH ZURICH', 540, 494);

    // Golden glowing Math & Physics cards (left) vs smoky French & Biology cards (right)
    drawLampGlow(ctx, 380, 660, 190, 0.38);
    ctx.fillStyle = '#FEF08A';
    drawRoundedRectPath(ctx, 265, 540, 250, 115, 12);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    drawRoundedRectPath(ctx, 265, 675, 250, 115, 12);
    ctx.fill();
    ctx.fillStyle = '#14532D';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('MATEMATIKA: 6 ★', 390, 605);
    ctx.fillText('FISIKA: 6 ★', 390, 740);

    ctx.fillStyle = '#94A3B8';
    drawRoundedRectPath(ctx, 565, 540, 250, 115, 12);
    ctx.fill();
    drawRoundedRectPath(ctx, 565, 675, 250, 115, 12);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.fillText('PRANCIS: 3 ☁', 690, 605);
    ctx.fillText('BIOLOGI: 3 ☁', 690, 740);
    // Animated smoke puffs rising from failed non-STEM subjects
    ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
    for (let s = 0; s < 3; s++) {
      const sy = 528 - ((info.timeSec * 28 + s * 22) % 64);
      ctx.beginPath();
      ctx.arc(690 + Math.sin(info.timeSec * 3 + s) * 14, sy, 12 + s * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (v === 'ruang-direktur-eth' || v === 'ruang-dosen-eth') {
    drawVintageRoomBase(ctx, {
      wallTop: '#164E63',
      wallBottom: '#155E75',
      stripeColor: 'rgba(253, 224, 71, 0.06)',
      wainscotWood: '#4A2511',
      wainscotTrim: '#D97706',
      floorTop: '#6B3B1E',
      floorBottom: '#3A1E0E',
      rugColor: '#0F766E',
      rugBorder: '#FBBF24',
    });
    drawLampGlow(ctx, 760, 960, 340, 0.28);
    drawFramedPortrait(ctx, 430, 390, 220, 260, '#D97706');
    drawWoodenTable(ctx, 210, 1160, 660, 190);
    // Colorful antique globe
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(800, 1085, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(792, 1075, 22, 0, Math.PI * 1.4);
    ctx.fill();
  } else {
    // Ruang Kuliah ETH (Walnut auditorium + emerald blackboard + sunlit campus window + 5 benches)
    drawVintageRoomBase(ctx, {
      wallTop: '#2E3A4D',
      wallBottom: '#3D4E68',
      stripeColor: 'rgba(255,255,255,0.05)',
      wainscotWood: '#5C3018',
      wainscotTrim: '#B45309',
      floorTop: '#784421',
      floorBottom: '#3E200F',
    });
    drawVintageWindow(ctx, 68, 360, 155, 290, {
      sun: true,
      curtainColor: '#991B1B',
      timeSec: info.timeSec,
    });
    ctx.fillStyle = '#78350F';
    ctx.fillRect(256, 406, 738, 388);
    ctx.fillStyle = '#14532D';
    ctx.fillRect(270, 420, 710, 360);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
    ctx.font = '700 30px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1896 — ETH ZURICH', 305, 475);
    ctx.fillText('∫ F·dr = ΔE   ∇²φ = 4πGρ', 305, 610);
    // Tiered student oak benches
    for (let b = 0; b < 3; b++) {
      drawWoodenTable(ctx, 135 + b * 290, 1190, 230, 160);
    }
  }
}

/** L-05: Bern Kantor Paten & Apartemen Olympia */
function renderL05(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const v = info.variant;
  const isSunset = v === 'kantor-senja';
  const isNight = v === 'meja-kerja-malam' || v === 'apartemen-olympia' || v === 'laci-rahasia';

  drawVintageRoomBase(ctx, {
    wallTop: isSunset ? '#6B2D3E' : isNight ? '#1E293B' : '#713F12',
    wallBottom: isSunset ? '#9A3412' : isNight ? '#273549' : '#A16207',
    stripeColor: 'rgba(254, 240, 138, 0.07)',
    wainscotWood: '#4A2511',
    wainscotTrim: '#D97706',
    floorTop: '#784421',
    floorBottom: '#3E200F',
    rugColor: isNight ? '#1E3A8A' : '#991B1B',
    rugBorder: '#F59E0B',
  });

  if (v === 'jendela-menara-jam' || v === 'fasad-kantor-paten' || v === 'kantor-senja' || v === 'kantor-1907') {
    drawVintageWindow(ctx, 85, 345, 285, 345, {
      sunset: isSunset,
      roofer: v === 'kantor-1907',
      sun: v === 'fasad-kantor-paten' || v === 'jendela-menara-jam',
      curtainColor: '#7F1D1D',
      timeSec: info.timeSec,
    });

    if (v === 'jendela-menara-jam') {
      // Colorful medieval Zytglogge Sandstone Clock Tower!
      ctx.save();
      ctx.fillStyle = '#A8A29E';
      ctx.fillRect(182, 430, 92, 260);
      ctx.fillStyle = '#B91C1C';
      ctx.beginPath();
      ctx.moveTo(170, 430);
      ctx.lineTo(228, 362);
      ctx.lineTo(286, 430);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(228, 515, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(228, 515, 23, 0, Math.PI * 2);
      ctx.fill();
      const ang = info.timeSec * 1.6;
      ctx.strokeStyle = PALETTE.einsteinYellow;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(228, 515);
      ctx.lineTo(228 + Math.cos(ang) * 19, 515 + Math.sin(ang) * 19);
      ctx.stroke();
      ctx.restore();
    }

    drawLampGlow(ctx, 760, 1020, 360, 0.34);
    // Mahogany patent desk + brass secret drawer
    ctx.fillStyle = '#5C3018';
    ctx.fillRect(340, 1170, 580, 180);
    ctx.fillStyle = '#783F21';
    ctx.fillRect(330, 1158, 600, 24);
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 4;
    ctx.strokeRect(520, 1210, 210, 64);

    if (v === 'fasad-kantor-paten') {
      ctx.fillStyle = '#FEF3C7';
      ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AHLI TEKNIS KELAS III', 630, 1142);
    }
  } else if (v === 'apartemen-olympia') {
    drawLampGlow(ctx, 540, 480, 430, 0.34);
    drawBrassChandelier(ctx, 540, 405);
    drawWoodenTable(ctx, 270, 1175, 540, 175, '#DC2626');
    // Sausages, tea pot & books on colorful red cloth
    ctx.fillStyle = '#E11D48';
    drawRoundedRectPath(ctx, 410, 1148, 68, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(550, 1140, 46, 33);
  } else if (v === 'laci-rahasia') {
    drawLampGlow(ctx, 540, 1020, 440, 0.34);
    ctx.fillStyle = '#5C3018';
    ctx.fillRect(140, 1080, 800, 270);
    ctx.fillStyle = '#783F21';
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 5;
    ctx.fillRect(280, 1140, 520, 160);
    ctx.strokeRect(280, 1140, 520, 160);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(320, 1110, 180, 60);
    ctx.fillRect(490, 1100, 210, 70);
  } else if (v === 'meja-kerja-malam') {
    drawVintageWindow(ctx, 730, 350, 240, 270, {
      moon: true,
      curtainColor: '#991B1B',
      timeSec: info.timeSec,
    });
    drawLampGlow(ctx, 310, 1020, 340, 0.32);
    drawWoodenTable(ctx, 160, 1170, 540, 180);
  }
}

/** L-06: Papan Konsep Klasik Berwarna (Vintage Wooden Lecture Hall Chalkboard) */
function renderL06(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const v = info.variant;
  // Warm antique walnut studio frame + rich hunter-green vintage slate chalkboard
  const bgG = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgG.addColorStop(0, '#143D2B');
  bgG.addColorStop(0.65, '#194A35');
  bgG.addColorStop(1, '#2D1B0F');
  ctx.fillStyle = bgG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle brass grid & wood wainscot border
  ctx.save();
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.08)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < CANVAS_W; x += 68) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FLOOR_Y);
    ctx.stroke();
  }
  ctx.fillStyle = '#4A2511';
  ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
  ctx.fillStyle = '#92400E';
  ctx.fillRect(0, FLOOR_Y - 12, CANVAS_W, 14);
  ctx.restore();

  if (v === 'papan-1905') {
    ctx.save();
    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.shadowColor = PALETTE.einsteinYellow;
    ctx.shadowBlur = 24;
    ctx.font = '800 132px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1905', 540, 540);
    ctx.restore();

    for (let i = 0; i < 6; i++) {
      const px = 220 + i * 125;
      const py = 740 + Math.sin(info.timeSec * 5 + i) * 45;
      ctx.fillStyle = i % 2 === 0 ? PALETTE.einsteinYellow : '#F97316';
      ctx.strokeStyle = PALETTE.chalkWhite;
      ctx.lineWidth = 3;
      drawRoundedRectPath(ctx, px, py, 34, 34, 8);
      ctx.fill();
      ctx.stroke();
    }
  } else if (v === 'meja-mikro') {
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 5;
    ctx.strokeRect(370, 620, 340, 380);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.fillRect(374, 700, 332, 296);

    const gx = 540 + Math.sin(info.timeSec * 6.5) * 65 + Math.cos(info.timeSec * 11) * 28;
    const gy = 840 + Math.cos(info.timeSec * 5.7) * 55;
    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.beginPath();
    ctx.arc(gx, gy, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38BDF8';
    for (let m = 0; m < 10; m++) {
      const mx = 420 + ((m * 73 + info.timeSec * 120) % 240);
      const my = 740 + ((m * 97 + info.timeSec * 90) % 220);
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (info.sceneProgress > 0.72) {
      ctx.save();
      ctx.translate(760, 560);
      ctx.rotate(-0.18);
      ctx.strokeStyle = PALETTE.checkGreen;
      ctx.lineWidth = 5;
      ctx.strokeRect(-110, -45, 220, 90);
      ctx.fillStyle = PALETTE.checkGreen;
      ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Dr. (1906)', 0, 12);
      ctx.restore();
    }
  } else if (v === 'papan-satu-persamaan') {
    drawLampGlow(ctx, 540, 880, 420, 0.34);
    ctx.save();
    ctx.fillStyle = PALETTE.chalkWhite;
    ctx.shadowColor = PALETTE.einsteinYellow;
    ctx.shadowBlur = 26;
    ctx.font = '800 148px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E = mc²', 540, 900);
    ctx.restore();
  } else if (v === 'dua-kartu') {
    for (const [cx, title, sub, col] of [
      [295, 'ATURAN 1', 'Hukum fisika sama', '#1E3A8A'],
      [785, 'ATURAN 2', 'Laju cahaya c tetap', '#9A3412'],
    ] as const) {
      ctx.strokeStyle = PALETTE.chalkWhite;
      ctx.fillStyle = col;
      ctx.lineWidth = 5;
      drawRoundedRectPath(ctx, cx - 185, 580, 370, 210, 20);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, cx, 650);
      ctx.fillStyle = PALETTE.chalkWhite;
      ctx.font = '600 26px "DM Sans", sans-serif';
      ctx.fillText(sub, cx, 715);
    }
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(80, 1110);
    ctx.lineTo(1000, 1110);
    ctx.stroke();
    const t1 = 180 + ((info.timeSec * 120) % 700);
    const t2 = 880 - ((info.timeSec * 120) % 700);
    ctx.fillStyle = PALETTE.electricBlue;
    drawRoundedRectPath(ctx, t1, 1060, 110, 48, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.notifPink;
    drawRoundedRectPath(ctx, t2, 1060, 110, 48, 10);
    ctx.fill();
  } else if (v === 'papan-penuh-coretan') {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.34)';
    ctx.font = '600 26px "JetBrains Mono", monospace';
    const formulas = [
      'p = γmv',
      'Δt = γΔt₀',
      'E² = (pc)² + (m₀c²)²',
      'λ = h/p',
      '∇×E = -∂B/∂t',
      'ds² = c²dt² - dx²',
    ];
    formulas.forEach((f, idx) => {
      ctx.fillText(f, 120 + (idx % 2) * 460, 460 + Math.floor(idx / 2) * 160);
    });
    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.font = '800 68px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E = mc²', 540, 740);
    ctx.strokeStyle = PALETTE.notifPink;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(540, 910, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(492, 862);
    ctx.lineTo(588, 958);
    ctx.moveTo(588, 862);
    ctx.lineTo(492, 958);
    ctx.stroke();
  } else if (v === 'papan-kusut' || v === 'papan-silang-1913') {
    ctx.fillStyle = 'rgba(254, 243, 199, 0.42)';
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('R_μν - ½ g_μν R = (8πG/c⁴) T_μν', 540, 560);
    ctx.fillText('Γ^λ_μν = ½ g^λσ (∂_μ g_νσ + ∂_ν g_μσ - ∂_σ g_μν)', 540, 640);
    if (v === 'papan-silang-1913') {
      ctx.fillStyle = PALETTE.chalkWhite;
      ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('1913', 300, 760);
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.fillText('v2 (1915)', 780, 760);
      ctx.strokeStyle = PALETTE.notifPink;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(220, 700);
      ctx.lineTo(380, 810);
      ctx.moveTo(380, 700);
      ctx.lineTo(220, 810);
      ctx.stroke();
    }
  } else if (v === 'papan-data-1919') {
    ctx.fillStyle = PALETTE.chalkWhite;
    ctx.font = '800 44px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1919 DATA', 110, 460);
    const settle = Math.min(1, Math.max(0, (info.sceneProgress - 0.45) / 0.35));
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(180, 880);
    ctx.lineTo(900, 540);
    ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const x = 210 + i * 50;
      const targetY = 865 - i * 23;
      const jitter = (1 - settle) * Math.sin(info.timeSec * 7 + i * 1.9) * 65;
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.beginPath();
      ctx.arc(x, targetY + jitter, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (v === 'papan-fisi-uranium') {
    drawLampGlow(ctx, 540, 700, 300, 0.3);
    const splitDist = Math.min(140, info.sceneProgress * 220);
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(540 - splitDist, 700, 52, 0, Math.PI * 2);
    ctx.arc(540 + splitDist, 700, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 4;
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2 + info.timeSec * 3;
      ctx.beginPath();
      ctx.moveTo(540 + Math.cos(a) * 30, 700 + Math.sin(a) * 30);
      ctx.lineTo(540 + Math.cos(a) * 95, 700 + Math.sin(a) * 95);
      ctx.stroke();
    }
  } else if (v === 'ruang-debat-dadu') {
    drawLampGlow(ctx, 540, 820, 320, 0.32);
    ctx.save();
    ctx.translate(540, 820);
    ctx.rotate(Math.sin(info.timeSec * 2.5) * 0.25);
    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 6;
    drawRoundedRectPath(ctx, -78, -78, 156, 156, 26);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#DC2626';
    for (const [dx, dy] of [
      [-34, -34],
      [34, -34],
      [0, 0],
      [-34, 34],
      [34, 34],
    ]) {
      ctx.beginPath();
      ctx.arc(dx, dy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** L-07: Langit & Kosmos (1900s Colorful Antique Astronomy Atlas) */
function renderL07(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const cg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  cg.addColorStop(0, '#1E1B4B');
  cg.addColorStop(0.5, '#311042');
  cg.addColorStop(1, '#0F172A');
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Brass astrolabe ring watermark
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(540, 740, 440, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(540, 740, 470, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Golden & cyan twinkling stars
  for (let i = 0; i < 70; i++) {
    const sx = (i * 173) % CANVAS_W;
    const sy = (i * 257) % CANVAS_H;
    const alpha = 0.28 + 0.65 * Math.abs(Math.sin(info.timeSec * 1.8 + i));
    ctx.fillStyle = i % 3 === 0 ? `rgba(254, 240, 138, ${alpha})` : `rgba(186, 230, 253, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  if (info.variant === 'orbit-merkurius') {
    drawLampGlow(ctx, 540, 740, 280, 0.5);
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(540, 740, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(532, 732, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(540, 740);
    ctx.rotate(info.timeSec * 0.22);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.ellipse(45, 0, 260, 170, 0, 0, Math.PI * 2);
    ctx.stroke();
    const ma = info.timeSec * 1.4;
    const mx = 45 + Math.cos(ma) * 260;
    const my = Math.sin(ma) * 170;
    ctx.fillStyle = '#EA580C';
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(mx, my, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#0F1B2D';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mx - 18, my - 12);
    ctx.lineTo(mx - 5, my - 4);
    ctx.moveTo(mx + 18, my - 12);
    ctx.lineTo(mx + 5, my - 4);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.font = '800 84px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('43″ / abad', 540, 440);
  } else if (info.variant === 'langit-gerhana') {
    drawLampGlow(ctx, 540, 760, 360, 0.5);
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(540, 760, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.beginPath();
    ctx.arc(540, 760, 112, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#050911';
    ctx.beginPath();
    ctx.arc(540, 760, 102, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(120, 620);
    ctx.lineTo(960, 620);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(120, 620);
    ctx.quadraticCurveTo(540, 560, 960, 720);
    ctx.stroke();
  } else if (info.variant === 'galaksi-menjauh') {
    const expand = 1 + info.sceneProgress * 0.65;
    const galColors = ['#38BDF8', '#F472B6', '#FACC15', '#34D399', '#A78BFA', '#FB923C'];
    for (let g = 0; g < 6; g++) {
      const ang = (g / 6) * Math.PI * 2 + 0.4;
      const dist = (130 + (g % 2) * 80) * expand;
      const gx = 540 + Math.cos(ang) * dist;
      const gy = 780 + Math.sin(ang) * dist;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(info.timeSec * 0.8 + g);
      ctx.strokeStyle = galColors[g % galColors.length];
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 12, Math.PI, Math.PI * 2.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.font = '800 110px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Λ', 180, 420);
  }
}

/** L-08: Aula Formal (Crimson Velvet Royal Society & White House Oval Room) */
function renderL08(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  drawVintageRoomBase(ctx, {
    wallTop: '#4A121C',
    wallBottom: '#781D2B',
    stripeColor: 'rgba(251, 191, 36, 0.08)',
    wainscotWood: '#422010',
    wainscotTrim: '#F59E0B',
    floorTop: '#5C3018',
    floorBottom: '#33170A',
    rugColor: '#1E3A8A',
    rugBorder: '#FBBF24',
  });

  // Grand crimson theatre/royal drapes left & right
  ctx.fillStyle = '#9F1239';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(185, 0);
  ctx.quadraticCurveTo(95, 560, 130, FLOOR_Y);
  ctx.lineTo(0, FLOOR_Y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(CANVAS_W, 0);
  ctx.lineTo(CANVAS_W - 185, 0);
  ctx.quadraticCurveTo(CANVAS_W - 95, 560, CANVAS_W - 130, FLOOR_Y);
  ctx.lineTo(CANVAS_W, FLOOR_Y);
  ctx.closePath();
  ctx.fill();

  drawLampGlow(ctx, 540, 260, 420, 0.34);
  drawBrassChandelier(ctx, 540, 215);

  if (info.variant === 'ruang-oval') {
    drawWoodenTable(ctx, 220, 1140, 640, 210);
    // Rich US Flag right
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(880, 640, 115, 220);
    ctx.fillStyle = '#FFFFFF';
    for (let sy = 665; sy < 850; sy += 42) {
      ctx.fillRect(880, sy, 115, 18);
    }
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(880, 640, 58, 105);
  } else if (info.variant === 'akademi-prusia') {
    // Prussian Academy Hall with November 1915 4-Thursday calendar!
    ctx.fillStyle = '#FEF3C7';
    drawRoundedRectPath(ctx, 260, 420, 560, 260, 18);
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(263, 423, 554, 62);
    ctx.fillStyle = '#FEF3C7';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOVEMBER 1915 · 4 KAMIS', 540, 462);
    const activeThu = Math.min(3, Math.floor(info.sceneProgress * 4));
    for (let k = 0; k < 4; k++) {
      const kx = 320 + k * 145;
      ctx.fillStyle = k <= activeThu ? '#FACC15' : '#E2E8F0';
      drawRoundedRectPath(ctx, kx - 48, 520, 96, 110, 12);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = '800 32px "JetBrains Mono", monospace';
      ctx.fillText(`${4 + k * 7}`, kx, 578);
    }
  } else {
    ctx.fillStyle = '#5C3018';
    ctx.fillRect(420, 1090, 240, 260);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(410, 1076, 260, 20);
    if (info.variant === 'royal-society' && info.sceneProgress > 0.5) {
      ctx.save();
      ctx.translate(540, 560);
      ctx.rotate(-0.08);
      ctx.fillStyle = '#FEF3C7';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 4;
      ctx.fillRect(-190, -110, 380, 220);
      ctx.strokeRect(-190, -110, 380, 220);
      ctx.fillStyle = '#0F1B2D';
      ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THE TIMES', 0, -52);
      ctx.fillStyle = '#B91C1C';
      ctx.font = '800 22px "DM Sans", sans-serif';
      ctx.fillText('REVOLUTION IN SCIENCE!', 0, 8);
      ctx.restore();
    }
  }
}

/** L-09: Peta Kuno, Dek Kapal Uap & Pulau Principe */
function renderL09(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const v = info.variant;
  if (v === 'dek-kapal') {
    const skyG = ctx.createLinearGradient(0, 0, 0, 980);
    skyG.addColorStop(0, '#4C1D95');
    skyG.addColorStop(0.55, '#DB2777');
    skyG.addColorStop(1, '#FB923C');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    drawLampGlow(ctx, 820, 640, 340, 0.38);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(820, 640, 92, 0, Math.PI * 2);
    ctx.fill();

    // Rolling turquoise & cerulean waves
    for (let layer = 0; layer < 2; layer++) {
      ctx.fillStyle = layer === 0 ? '#0284C7' : '#0369A1';
      ctx.beginPath();
      const baseY = 980 + layer * 90;
      ctx.moveTo(0, CANVAS_H);
      for (let x = 0; x <= CANVAS_W; x += 60) {
        ctx.lineTo(x, baseY + Math.sin(x * 0.012 + info.timeSec * 2.5 + layer) * 18);
      }
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.closePath();
      ctx.fill();
    }

    // Teak wooden ship deck + brass railing
    ctx.fillStyle = '#78350F';
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 1210);
    ctx.lineTo(CANVAS_W, 1210);
    ctx.stroke();
    for (let px = 80; px < CANVAS_W; px += 180) {
      ctx.beginPath();
      ctx.moveTo(px, 1210);
      ctx.lineTo(px, FLOOR_Y);
      ctx.stroke();
    }
  } else if (v === 'pulau-principe') {
    const skyG = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    skyG.addColorStop(0, '#0F766E');
    skyG.addColorStop(1, '#38BDF8');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);

    // Tropical green palms left & right
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(120, 1120, 140, 48, -0.35, 0, Math.PI * 2);
    ctx.ellipse(960, 1120, 140, 48, 0.35, 0, Math.PI * 2);
    ctx.fill();

    const rainOn = info.sceneProgress < 0.55;
    const cloudGap = Math.max(0, (info.sceneProgress - 0.5) * 160);
    ctx.fillStyle = PALETTE.einsteinYellow;
    ctx.beginPath();
    ctx.arc(540, 440, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(460 - cloudGap, 440, 95, 0, Math.PI * 2);
    ctx.arc(620 + cloudGap, 440, 95, 0, Math.PI * 2);
    ctx.fill();
    if (rainOn) {
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 42; i++) {
        const rx = (i * 73) % CANVAS_W;
        const ry = (i * 113 + info.timeSec * 460) % FLOOR_Y;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 18, ry + 42);
        ctx.stroke();
      }
    }
  } else if (v === 'peta-eropa') {
    // Central Europe Vintage Map (Zurich -> Praha -> Berlin glowing golden career arc)
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#EFE1C4';
    drawRoundedRectPath(ctx, 46, 260, CANVAS_W - 92, CANVAS_H - 520, 28);
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = '#84CC16';
    drawRoundedRectPath(ctx, 130, 560, 270, 360, 44);
    ctx.fill();
    ctx.fillStyle = '#EAB308';
    drawRoundedRectPath(ctx, 420, 480, 290, 420, 44);
    ctx.fill();
    ctx.fillStyle = '#16A34A';
    drawRoundedRectPath(ctx, 640, 410, 290, 480, 44);
    ctx.fill();

    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(270, 740);
    ctx.lineTo(540, 620);
    ctx.lineTo(790, 480);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [cx, cy, label] of [
      [270, 740, 'ZURICH'],
      [540, 620, 'PRAHA'],
      [790, 480, 'BERLIN'],
    ] as const) {
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#1E293B';
      ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy - 28);
    }
  } else {
    // Rich Antique Sepia Parchment Cartography Map (London -> Principe & Sobral)
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#E7D3AD';
    drawRoundedRectPath(ctx, 46, 260, CANVAS_W - 92, CANVAS_H - 520, 28);
    ctx.fill();
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Longitude/latitude vintage lines
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.14)';
    ctx.lineWidth = 2;
    for (let gx = 160; gx < 960; gx += 130) {
      ctx.beginPath();
      ctx.moveTo(gx, 280);
      ctx.lineTo(gx, 1620);
      ctx.stroke();
    }

    // Stylized emerald & ochre antique continents
    ctx.fillStyle = '#65A30D';
    drawRoundedRectPath(ctx, 120, 420, 320, 340, 48);
    ctx.fill();
    ctx.fillStyle = '#D97706';
    drawRoundedRectPath(ctx, 560, 480, 400, 440, 64);
    ctx.fill();
    ctx.fillStyle = '#15803D';
    drawRoundedRectPath(ctx, 160, 860, 240, 340, 48);
    ctx.fill();

    // Crimson shipping route + brass nodes
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 6;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(280, 560);
    ctx.quadraticCurveTo(520, 460, 740, 640);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [nx, ny] of [
      [280, 560],
      [540, 515],
      [740, 640],
    ]) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(nx, ny, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

/** L-10: Jalan Kota Tua Eropa & Pelabuhan 1933 */
function renderL10(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  const v = info.variant;
  if (v === 'zurich-bersalju') {
    const skyG = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    skyG.addColorStop(0, '#1E1B4B');
    skyG.addColorStop(1, '#3B82F6');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

    // Cobblestone road
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);

    // Colorful Belle Epoque townhouses with warm amber glowing windows!
    const houses = [
      [36, 620, 270, 730, '#B45309'],
      [340, 520, 325, 830, '#991B1B'],
      [705, 650, 330, 700, '#0F766E'],
    ] as const;
    for (const [hx, hy, hw, hh, col] of houses) {
      ctx.fillStyle = col;
      ctx.fillRect(hx, hy, hw, hh);
      ctx.fillStyle = '#FDE047';
      for (let wy = hy + 70; wy < hy + 360; wy += 120) {
        ctx.fillRect(hx + 38, wy, 56, 72);
        ctx.fillRect(hx + hw - 94, wy, 56, 72);
      }
    }

    // Layered snow
    ctx.fillStyle = PALETTE.chalkWhite;
    for (let i = 0; i < 48; i++) {
      const sx = (i * 89 + Math.sin(info.timeSec + i) * 18) % CANVAS_W;
      const sy = (i * 131 + info.timeSec * (80 + (i % 3) * 45)) % CANVAS_H;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5 + (i % 3) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Harbor 1933: twilight orange-indigo sky, timber pier & red-and-black grand steamship
    const skyG = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    skyG.addColorStop(0, '#1E1B4B');
    skyG.addColorStop(0.65, '#4C1D95');
    skyG.addColorStop(1, '#EA580C');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

    drawLampGlow(ctx, 180, 960, 150, 0.38);
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(155, 980);
    ctx.lineTo(180, 910);
    ctx.lineTo(205, 980);
    ctx.closePath();
    ctx.fill();

    // Wooden dock
    ctx.fillStyle = '#5C3018';
    ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);

    // Red & charcoal vintage transatlantic liner right
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(580, 1140, 480, 210);
    ctx.fillStyle = '#F5F5F0';
    ctx.fillRect(595, 860, 465, 280);
    // Funnel
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(760, 680, 75, 180);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(760, 680, 75, 42);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.arc(
        795 + s * 28,
        640 - ((info.timeSec * 30 + s * 20) % 90),
        22 + s * 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

/** L-11: Princeton Musim Gugur & Ruang Kerja Malam */
function renderL11(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  if (info.variant === 'princeton-musim-gugur') {
    const skyG = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    skyG.addColorStop(0, '#1D4ED8');
    skyG.addColorStop(0.6, '#60A5FA');
    skyG.addColorStop(1, '#FDE68A');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, CANVAS_W, FLOOR_Y);

    // Classic redbrick Ivy League Gothic campus building
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(75, 550, 430, 800);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(140, 650, 76, 130);
    ctx.fillRect(280, 650, 76, 130);

    // Vivid autumn foliage crown behind building
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(820, 760, 185, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(920, 880, 145, 0, Math.PI * 2);
    ctx.fill();

    if (info.sceneProgress > 0.35) {
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(0, 1180, CANVAS_W, CANVAS_H - 1180);
    } else {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
    }

    // Drifting autumn maple leaves
    const leafColors = ['#EA580C', '#DC2626', '#FACC15'];
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = leafColors[i % 3];
      const lx = (i * 117 + Math.sin(info.timeSec * 1.5 + i) * 35) % CANVAS_W;
      const ly = (i * 163 + info.timeSec * 90) % CANVAS_H;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 11, 6, info.timeSec + i, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Cozy mahogany night library & green banker's lamp
    drawVintageRoomBase(ctx, {
      wallTop: '#2E1A14',
      wallBottom: '#4A2B20',
      stripeColor: 'rgba(251, 191, 36, 0.06)',
      wainscotWood: '#3B1E10',
      wainscotTrim: '#B45309',
      floorTop: '#5C3018',
      floorBottom: '#2E150A',
      rugColor: '#7F1D1D',
      rugBorder: '#F59E0B',
    });
    drawVintageWindow(ctx, 740, 355, 240, 265, {
      moon: true,
      curtainColor: '#991B1B',
      timeSec: info.timeSec,
    });
    drawLampGlow(ctx, 320, 1040, 340, 0.3);

    // Classic green chalkboard with unified field theory draft
    ctx.fillStyle = '#78350F';
    ctx.fillRect(190, 470, 500, 340);
    ctx.fillStyle = '#14532D';
    ctx.fillRect(204, 484, 472, 312);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.78)';
    ctx.font = '700 34px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('g_μν + F_μν = ?', 440, 645);
  }
}

/** L-12: Layar Media & Observatorium */
function renderL12(ctx: CanvasRenderingContext2D, info: BgRenderContext) {
  if (info.variant === 'layar-ponsel-raksasa') {
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    g.addColorStop(0, '#312E81');
    g.addColorStop(1, '#0F172A');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = PALETTE.einsteinYellow;
    ctx.lineWidth = 6;
    drawRoundedRectPath(ctx, 130, 280, 820, 1340, 56);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2563EB';
    drawRoundedRectPath(ctx, 190, 430, 700, 260, 24);
    ctx.fill();
    ctx.fillStyle = PALETTE.chalkWhite;
    ctx.font = '700 26px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('“Kegilaan adalah mengulang hal sama…”', 540, 550);

    ctx.save();
    ctx.translate(540, 560);
    ctx.rotate(-0.14);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 8;
    ctx.strokeRect(-130, -45, 260, 90);
    ctx.fillStyle = '#EF4444';
    ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PALSU ❌', 0, 15);
    ctx.restore();
  } else {
    // Rich Vintage Mount Wilson / LIGO Brass & Cobalt Observatory Room
    drawVintageRoomBase(ctx, {
      wallTop: '#0F172A',
      wallBottom: '#1E3A5F',
      stripeColor: 'rgba(56, 189, 248, 0.06)',
      wainscotWood: '#334155',
      wainscotTrim: '#F59E0B',
      floorTop: '#475569',
      floorBottom: '#1E293B',
    });

    ctx.fillStyle = '#0B1322';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    drawRoundedRectPath(ctx, 150, 420, 780, 440, 24);
    ctx.fill();
    ctx.stroke();

    const detected = info.sceneProgress > 0.45;
    ctx.strokeStyle = detected ? PALETTE.einsteinYellow : '#38BDF8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 180; x <= 900; x += 6) {
      const norm = (x - 180) / 720;
      const env = detected ? Math.exp(-Math.pow((norm - 0.6) * 5, 2)) : 0.15;
      const y =
        640 +
        Math.sin(norm * 36 - info.timeSec * 8) * (16 + env * 135);
      if (x === 180) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/** Master Background Dispatcher + Colorful Split Screen (x=540) */
export function renderMasterBackground(
  ctx: CanvasRenderingContext2D,
  info: BgRenderContext
) {
  if (info.splitScreen) {
    const leftInfo: BgRenderContext = { ...info, splitScreen: false };
    const rightInfo: BgRenderContext = { ...info, splitScreen: false };

    // Left half clip
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_W / 2, CANVAS_H);
    ctx.clip();
    if (info.variant === 'split-munich-musik') {
      renderL02(ctx, { ...leftInfo, variant: 'kelas-munich' });
    } else if (info.variant === 'split-jam-roket') {
      renderL07(ctx, { ...leftInfo, variant: 'galaksi-menjauh' });
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(270, 960, 82, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(270, 720, 76, 0, Math.PI * 2);
      ctx.stroke();
      const fastA = info.timeSec * 4.5;
      ctx.strokeStyle = PALETTE.einsteinYellow;
      ctx.beginPath();
      ctx.moveTo(270, 720);
      ctx.lineTo(270 + Math.cos(fastA) * 56, 720 + Math.sin(fastA) * 56);
      ctx.stroke();
    } else if (info.variant === 'split-berlin-gottingen') {
      renderL06(ctx, { ...leftInfo, variant: 'papan-kusut' });
    } else if (info.variant === 'split-jepang-berlin') {
      // Bright festive Kyoto Japan with warm red lanterns!
      drawVintageRoomBase(ctx, {
        wallTop: '#7C2D12',
        wallBottom: '#B45309',
        stripeColor: 'rgba(254, 240, 138, 0.08)',
        wainscotWood: '#451A03',
        wainscotTrim: '#F59E0B',
        floorTop: '#92400E',
        floorBottom: '#451A03',
      });
      for (const [lx, ly] of [
        [130, 320],
        [340, 290],
        [450, 360],
      ]) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(lx, ly, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    ctx.restore();

    // Right half clip
    ctx.save();
    ctx.beginPath();
    ctx.rect(CANVAS_W / 2, 0, CANVAS_W / 2, CANVAS_H);
    ctx.clip();
    if (info.variant === 'split-munich-musik') {
      renderL01(ctx, { ...rightInfo, variant: 'ruang-makan-munich' });
    } else if (info.variant === 'split-jam-roket') {
      renderL07(ctx, { ...rightInfo, variant: 'galaksi-menjauh' });
      const ry = 1040 - info.sceneProgress * 220;
      ctx.fillStyle = '#FEF3C7';
      drawRoundedRectPath(ctx, 760, ry - 80, 100, 170, 38);
      ctx.fill();
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(810, ry, 42, 0, Math.PI * 2);
      ctx.stroke();
      const slowA = info.timeSec * 0.9;
      ctx.strokeStyle = '#B45309';
      ctx.beginPath();
      ctx.moveTo(810, ry);
      ctx.lineTo(810 + Math.cos(slowA) * 32, ry + Math.sin(slowA) * 32);
      ctx.stroke();
    } else if (info.variant === 'split-berlin-gottingen') {
      renderL06(ctx, { ...rightInfo, variant: 'papan-kusut' });
    } else if (info.variant === 'split-jepang-berlin') {
      drawVintageRoomBase(ctx, {
        wallTop: '#1E293B',
        wallBottom: '#334155',
        stripeColor: 'rgba(255,255,255,0.04)',
        wainscotWood: '#1E1B18',
        wainscotTrim: '#64748B',
        floorTop: '#334155',
        floorBottom: '#0F172A',
      });
      ctx.fillStyle = '#475569';
      ctx.fillRect(680, 620, 220, 280);
      ctx.strokeStyle = PALETTE.notifPink;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(710, 660);
      ctx.lineTo(870, 860);
      ctx.moveTo(870, 660);
      ctx.lineTo(710, 860);
      ctx.stroke();
    }
    ctx.restore();

    // Vertical divider
    ctx.save();
    ctx.strokeStyle = PALETTE.chalkWhite;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(540, 150);
    ctx.lineTo(540, 1670);
    ctx.stroke();

    // Split Labels cleanly at y=335
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (info.splitLeftLabel) {
      const lw = ctx.measureText(info.splitLeftLabel).width + 38;
      ctx.fillStyle = 'rgba(15, 27, 45, 0.88)';
      drawRoundedRectPath(ctx, 270 - lw / 2, 314, lw, 42, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 245, 240, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = PALETTE.chalkWhite;
      ctx.fillText(info.splitLeftLabel, 270, 336);
    }
    if (info.splitRightLabel) {
      const rw = ctx.measureText(info.splitRightLabel).width + 38;
      ctx.fillStyle = 'rgba(15, 27, 45, 0.88)';
      drawRoundedRectPath(ctx, 810 - rw / 2, 314, rw, 42, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 245, 240, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = PALETTE.einsteinYellow;
      ctx.fillText(info.splitRightLabel, 810, 336);
    }
    ctx.restore();
    return;
  }

  switch (info.bgId) {
    case 'L-01':
      renderL01(ctx, info);
      break;
    case 'L-02':
      renderL02(ctx, info);
      break;
    case 'L-03':
      renderL03(ctx, info);
      break;
    case 'L-04':
      renderL04(ctx, info);
      break;
    case 'L-05':
      renderL05(ctx, info);
      break;
    case 'L-06':
      renderL06(ctx, info);
      break;
    case 'L-07':
      renderL07(ctx, info);
      break;
    case 'L-08':
      renderL08(ctx, info);
      break;
    case 'L-09':
      renderL09(ctx, info);
      break;
    case 'L-10':
      renderL10(ctx, info);
      break;
    case 'L-11':
      renderL11(ctx, info);
      break;
    case 'L-12':
      renderL12(ctx, info);
      break;
  }
}
