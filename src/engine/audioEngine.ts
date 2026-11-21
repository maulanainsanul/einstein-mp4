import {
  EpisodeAudioState,
  EpisodeData,
  MixerSettings,
  SceneData,
  UploadedAudioSlot,
} from '../types/studio';

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/** Extract normalized amplitude envelope at 60Hz for mic waveform reactivity & ducking */
export function extractAudioPeaks(buffer: AudioBuffer, fps = 60): number[] {
  const ch0 = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const step = Math.max(1, Math.floor(sampleRate / fps));
  const peaks: number[] = [];
  for (let i = 0; i < ch0.length; i += step) {
    let max = 0;
    const end = Math.min(ch0.length, i + step);
    for (let j = i; j < end; j++) {
      const v = Math.abs(ch0[j]);
      if (v > max) max = v;
    }
    peaks.push(Math.min(1, max * 1.45));
  }
  return peaks;
}

export async function decodeUploadedAudioFile(
  file: File
): Promise<UploadedAudioSlot> {
  const arrayBuf = await file.arrayBuffer();
  const ctx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
    const peaks = extractAudioPeaks(decoded, 60);
    return {
      fileName: file.name,
      durationSec: decoded.duration,
      buffer: decoded,
      peaks,
    };
  } finally {
    await ctx.close();
  }
}

/** Generate a clean synthetic narration-cadence AudioBuffer for instant studio testing */
export async function createProceduralDemoSlot(
  episode: EpisodeData,
  durationSec = 50
): Promise<UploadedAudioSlot> {
  const sampleRate = 44100;
  const off = new OfflineAudioContext(1, Math.floor(durationSec * sampleRate), sampleRate);

  const activeDur = Math.max(4, durationSec - 1);
  const wordCount = episode.scenes.reduce(
    (acc, s) => acc + s.narration.split(/\s+/).length,
    0
  );
  const syllables = Math.max(40, Math.min(180, wordCount));

  for (let i = 0; i < syllables; i++) {
    const t = (i / syllables) * activeDur;
    if (i % 14 === 13) continue;
    const osc = off.createOscillator();
    const gain = off.createGain();
    osc.type = 'triangle';
    const baseFreq = 135 + ((i * 29) % 55);
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.88, t + 0.14);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(off.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  const rendered = await off.startRendering();
  return {
    fileName: `Demo_Dubbing_Ep${String(episode.id).padStart(2, '0')}_${Math.round(durationSec)}s.wav`,
    durationSec: rendered.duration,
    buffer: rendered,
    peaks: extractAudioPeaks(rendered, 60),
  };
}

/** Compute Scene 1-4 durations and offsets from EpisodeAudioState */
export function computeAudioTimeline(
  episode: EpisodeData,
  audioState: EpisodeAudioState
): {
  sceneDurations: [number, number, number, number];
  sceneOffsets: [number, number, number, number];
} {
  if (audioState.mode === 'per-scene') {
    const d1 = audioState.sceneAudios[1]?.durationSec ?? 15;
    const d2 = audioState.sceneAudios[2]?.durationSec ?? 15;
    const d3 = audioState.sceneAudios[3]?.durationSec ?? 15;
    const d4 = audioState.sceneAudios[4]?.durationSec ?? 15;
    return {
      sceneDurations: [d1, d2, d3, d4],
      sceneOffsets: [0, d1, d1 + d2, d1 + d2 + d3],
    };
  }

  const full = audioState.fullAudio;
  if (!full) {
    return {
      sceneDurations: [15, 15, 15, 15],
      sceneOffsets: [0, 15, 30, 45],
    };
  }

  const total = full.durationSec;

  if (audioState.splitMethod === 'silence-detect' && full.peaks.length > 120) {
    const findQuietSplit = (targetFrac: number): number => {
      const centerIdx = Math.floor(full.peaks.length * targetFrac);
      const searchRad = Math.floor(full.peaks.length * 0.08);
      let bestIdx = centerIdx;
      let bestVal = Infinity;
      for (
        let i = Math.max(10, centerIdx - searchRad);
        i < Math.min(full.peaks.length - 10, centerIdx + searchRad);
        i++
      ) {
        const localAvg =
          (full.peaks[i - 2] +
            full.peaks[i - 1] +
            full.peaks[i] +
            full.peaks[i + 1] +
            full.peaks[i + 2]) /
          5;
        if (localAvg < bestVal) {
          bestVal = localAvg;
          bestIdx = i;
        }
      }
      return (bestIdx / full.peaks.length) * total;
    };

    const s1End = findQuietSplit(0.25);
    const s2End = findQuietSplit(0.5);
    const s3End = findQuietSplit(0.75);
    const d1 = Math.max(2, s1End);
    const d2 = Math.max(2, s2End - s1End);
    const d3 = Math.max(2, s3End - s2End);
    const d4 = Math.max(2, total - s3End);
    return {
      sceneDurations: [d1, d2, d3, d4],
      sceneOffsets: [0, d1, d1 + d2, d1 + d2 + d3],
    };
  }

  const weights = episode.scenes.map((s) =>
    Math.max(10, s.narration.replace(/<[^>]+>/g, '').split(/\s+/).length)
  );
  const sumW = weights.reduce((a, b) => a + b, 0);
  const d1 = (weights[0] / sumW) * total;
  const d2 = (weights[1] / sumW) * total;
  const d3 = (weights[2] / sumW) * total;
  const d4 = Math.max(1.5, total - (d1 + d2 + d3));
  return {
    sceneDurations: [d1, d2, d3, d4],
    sceneOffsets: [0, d1, d1 + d2, d1 + d2 + d3],
  };
}

/** Rich Foley & Editorial Sound Effects Palette (Non-Dubbing) */
export type SfxKind =
  | 'pop'
  | 'ting'
  | 'whoosh'
  | 'chalk'
  | 'tick'
  | 'stamp'
  | 'scratch'
  | 'knock'
  | 'camera'
  | 'heart'
  | 'crickets'
  | 'baby-cry'
  | 'loading'
  | 'violin'
  | 'page-flip'
  | 'train'
  | 'waves'
  | 'typing'
  | 'telegraph'
  | 'boing'
  | 'applause';

function detectSfxFromText(txt: string): SfxKind | null {
  const s = txt.toLowerCase();
  if (s.includes('tangis bayi') || s.includes('menangis') || s.includes('bayi')) return 'baby-cry';
  if (s.includes('tuuung') || s.includes('loading') || s.includes('99%')) return 'loading';
  if (s.includes('record scratch') || s.includes('dipotong')) return 'scratch';
  if (s.includes('biola') || s.includes('mozart')) return 'violin';
  if (s.includes('kapur') || s.includes('menggores') || s.includes('tulis')) return 'chalk';
  if (s.includes('halaman') || s.includes('buku') || s.includes('kertas') || s.includes('surat') || s.includes('catatan')) return 'page-flip';
  if (s.includes('kereta') || s.includes('lokomotif')) return 'train';
  if (s.includes('ombak') || s.includes('kapal') || s.includes('laut')) return 'waves';
  if (s.includes('ketik') || s.includes('ponsel') || s.includes('netijen') || s.includes('notifikasi')) return 'typing';
  if (s.includes('telegram') || s.includes('morse') || s.includes('sinyal')) return 'telegraph';
  if (s.includes('jam') || s.includes('tik') || s.includes('detak')) return 'tick';
  if (s.includes('ketukan') || s.includes('pintu')) return 'knock';
  if (s.includes('kamera') || s.includes('rana') || s.includes('blitz') || s.includes('foto')) return 'camera';
  if (s.includes('jantung') || s.includes('degup')) return 'heart';
  if (s.includes('jangkrik') || s.includes('sunyi')) return 'crickets';
  if (s.includes('tepuk tangan') || s.includes('royal') || s.includes('sorak')) return 'applause';
  if (s.includes('stempel') || s.includes('palu') || s.includes('dobrak')) return 'stamp';
  if (s.includes('whoosh') || s.includes('pan') || s.includes('meluncur')) return 'whoosh';
  if (s.includes('ting') || s.includes('ding') || s.includes('ide') || s.includes('cahaya')) return 'ting';
  if (s.includes('plop') || s.includes('pop') || s.includes('roda')) return 'pop';
  return null;
}

export function detectSfxKindsForScene(scene: SceneData): SfxKind[] {
  const combined = `${scene.sfxNote} ${scene.musicNote} ${scene.actingSummary} ${scene.backgroundVariant}`;
  const found = new Set<SfxKind>();

  const checks: [RegExp, SfxKind][] = [
    [/tangis bayi|bayi bernama|maja menangis/i, 'baby-cry'],
    [/tuuung|loading/i, 'loading'],
    [/record scratch/i, 'scratch'],
    [/biola|mozart/i, 'violin'],
    [/kapur|menggores/i, 'chalk'],
    [/halaman|kertas|buku|surat|catatan/i, 'page-flip'],
    [/kereta/i, 'train'],
    [/ombak|kapal|laut/i, 'waves'],
    [/ketik|netijen|notifikasi|komentar/i, 'typing'],
    [/telegram|morse/i, 'telegraph'],
    [/jam|tik/i, 'tick'],
    [/ketukan|pintu/i, 'knock'],
    [/kamera|rana|blitz/i, 'camera'],
    [/jantung/i, 'heart'],
    [/jangkrik/i, 'crickets'],
    [/tepuk tangan|royal society|nobel/i, 'applause'],
    [/whoosh/i, 'whoosh'],
    [/ting|ding/i, 'ting'],
    [/plop|pop/i, 'pop'],
    [/stempel/i, 'stamp'],
  ];

  for (const [rx, kind] of checks) {
    if (rx.test(combined)) found.add(kind);
  }
  if (scene.sceneNumber === 4) found.add('stamp');
  if (found.size === 0) found.add('pop');
  return Array.from(found);
}

function createNoiseBuffer(ctx: BaseAudioContext, durSec: number): AudioBuffer {
  const bufSize = Math.max(1, Math.floor(ctx.sampleRate * durSec));
  const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

export function scheduleSfxSound(
  ctx: BaseAudioContext,
  dest: AudioNode,
  kind: SfxKind,
  when: number,
  gainAmount: number
) {
  const safeWhen = Math.max(0, when);
  const master = ctx.createGain();
  master.gain.value = Math.min(1.4, Math.max(0.02, gainAmount));
  master.connect(dest);

  switch (kind) {
    case 'pop': {
      // Resonant comic bubble/cork pop + sub punch
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, safeWhen);
      osc.frequency.exponentialRampToValueAtTime(680, safeWhen + 0.055);
      osc.frequency.exponentialRampToValueAtTime(420, safeWhen + 0.11);
      g.gain.setValueAtTime(0.001, safeWhen);
      g.gain.linearRampToValueAtTime(0.85, safeWhen + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.13);
      osc.connect(g);
      g.connect(master);
      osc.start(safeWhen);
      osc.stop(safeWhen + 0.14);
      break;
    }

    case 'boing': {
      // Snappy spring cartoon zoom-kaget accent
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, safeWhen);
      osc.frequency.exponentialRampToValueAtTime(580, safeWhen + 0.12);
      osc.frequency.exponentialRampToValueAtTime(390, safeWhen + 0.34);

      lfo.frequency.setValueAtTime(28, safeWhen);
      lfoG.gain.setValueAtTime(45, safeWhen);
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);

      g.gain.setValueAtTime(0.001, safeWhen);
      g.gain.linearRampToValueAtTime(0.7, safeWhen + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.38);

      osc.connect(g);
      g.connect(master);
      osc.start(safeWhen);
      lfo.start(safeWhen);
      osc.stop(safeWhen + 0.39);
      lfo.stop(safeWhen + 0.39);
      break;
    }

    case 'ting': {
      // Sparkling two-harmonic celesta/bell shimmer
      for (const [freq, amp, dur] of [
        [1318.5, 0.55, 0.52],
        [1975.5, 0.28, 0.38],
        [2637.0, 0.16, 0.25],
      ] as const) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, safeWhen);
        g.gain.setValueAtTime(0.001, safeWhen);
        g.gain.linearRampToValueAtTime(amp, safeWhen + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, safeWhen + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(safeWhen);
        osc.stop(safeWhen + dur + 0.02);
      }
      break;
    }

    case 'loading': {
      // Comical ascending 3-note UI loading arpeggio + soft "tuuung" hum
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const t = safeWhen + idx * 0.085;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.45, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.25);
      });
      break;
    }

    case 'baby-cry': {
      // Gentle comical cartoonish baby "oeeek-oeeek" formant wobble
      for (let i = 0; i < 2; i++) {
        const t = safeWhen + i * 0.34;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(540 + i * 35, t);
        osc.frequency.exponentialRampToValueAtTime(430, t + 0.26);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1250, t);
        filter.Q.value = 3.2;

        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.42, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.29);
      }
      break;
    }

    case 'violin': {
      // Rich warm Mozart string chord + vibrato
      for (const freq of [440, 554.37, 659.25]) {
        const osc = ctx.createOscillator();
        const vib = ctx.createOscillator();
        const vibG = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, safeWhen);
        vib.frequency.setValueAtTime(5.8, safeWhen);
        vibG.gain.setValueAtTime(6, safeWhen);
        vib.connect(vibG);
        vibG.connect(osc.frequency);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, safeWhen);

        g.gain.setValueAtTime(0.001, safeWhen);
        g.gain.linearRampToValueAtTime(0.22, safeWhen + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.85);

        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        osc.start(safeWhen);
        vib.start(safeWhen);
        osc.stop(safeWhen + 0.86);
        vib.stop(safeWhen + 0.86);
      }
      break;
    }

    case 'stamp': {
      // Heavy rubber ink stamp thud + paper slap
      const thud = ctx.createOscillator();
      const tg = ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(175, safeWhen);
      thud.frequency.exponentialRampToValueAtTime(36, safeWhen + 0.16);
      tg.gain.setValueAtTime(0.95, safeWhen);
      tg.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.18);
      thud.connect(tg);
      tg.connect(master);
      thud.start(safeWhen);
      thud.stop(safeWhen + 0.19);

      // Crisp slap transient
      const slap = ctx.createBufferSource();
      slap.buffer = createNoiseBuffer(ctx, 0.06);
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.setValueAtTime(1600, safeWhen);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.55, safeWhen);
      sg.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.055);
      slap.connect(hp);
      hp.connect(sg);
      sg.connect(master);
      slap.start(safeWhen);
      slap.stop(safeWhen + 0.06);
      break;
    }

    case 'tick': {
      // Mechanical pocket watch double escapement ("tik... tok")
      for (const [offset, freq] of [
        [0, 1280],
        [0.18, 980],
        [0.36, 1280],
        [0.54, 980],
      ] as const) {
        const t = safeWhen + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.32, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.032);
      }
      break;
    }

    case 'heart': {
      // Deep resonant double chest heartbeat ("lub-dub")
      for (const [offset, fStart] of [
        [0, 92],
        [0.19, 76],
      ] as const) {
        const t = safeWhen + offset;
        const osc = ctx.createOscillator();
        const hg = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fStart, t);
        osc.frequency.exponentialRampToValueAtTime(34, t + 0.14);
        hg.gain.setValueAtTime(0.001, t);
        hg.gain.linearRampToValueAtTime(0.9, t + 0.015);
        hg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(hg);
        hg.connect(master);
        osc.start(t);
        osc.stop(t + 0.17);
      }
      break;
    }

    case 'knock': {
      // Three hollow oak door knocks
      for (const offset of [0, 0.14, 0.28]) {
        const t = safeWhen + offset;
        const osc = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const kg = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(68, t + 0.075);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(650, t);
        kg.gain.setValueAtTime(0.75, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(f);
        f.connect(kg);
        kg.connect(master);
        osc.start(t);
        osc.stop(t + 0.1);
      }
      break;
    }

    case 'chalk': {
      // Realistic rhythmic chalk scribble strokes on blackboard
      for (let i = 0; i < 4; i++) {
        const t = safeWhen + i * 0.095;
        const dur = 0.065;
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, dur);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2400 + (i % 2) * 700, t);
        bp.Q.value = 3.5;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.45, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(bp);
        bp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + dur);
      }
      break;
    }

    case 'page-flip': {
      // Crisp double paper-page rustle sweep
      for (const offset of [0, 0.11]) {
        const t = safeWhen + offset;
        const dur = 0.09;
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuffer(ctx, dur);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(1800, t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.38, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(hp);
        hp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + dur);
      }
      break;
    }

    case 'whoosh': {
      // Lush stereo Doppler air-rush
      const dur = 0.34;
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBuffer(ctx, dur);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1.8;
      filter.frequency.setValueAtTime(260, safeWhen);
      filter.frequency.exponentialRampToValueAtTime(1400, safeWhen + dur * 0.45);
      filter.frequency.exponentialRampToValueAtTime(220, safeWhen + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, safeWhen);
      g.gain.linearRampToValueAtTime(0.55, safeWhen + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, safeWhen + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(master);
      src.start(safeWhen);
      src.stop(safeWhen + dur);
      break;
    }

    case 'scratch': {
      // Authentic vinyl record-scratch pitch-rip drop
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, safeWhen);
      osc.frequency.exponentialRampToValueAtTime(110, safeWhen + 0.14);
      osc.frequency.exponentialRampToValueAtTime(340, safeWhen + 0.19);
      osc.frequency.exponentialRampToValueAtTime(75, safeWhen + 0.28);
      g.gain.setValueAtTime(0.45, safeWhen);
      g.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.29);
      osc.connect(g);
      g.connect(master);
      osc.start(safeWhen);
      osc.stop(safeWhen + 0.3);
      break;
    }

    case 'camera': {
      // Vintage 1951 mechanical camera shutter click + flash pop
      const click = ctx.createBufferSource();
      click.buffer = createNoiseBuffer(ctx, 0.05);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(3200, safeWhen);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.72, safeWhen);
      cg.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.045);
      click.connect(bp);
      bp.connect(cg);
      cg.connect(master);
      click.start(safeWhen);
      click.stop(safeWhen + 0.05);

      const flashOsc = ctx.createOscillator();
      const fg = ctx.createGain();
      flashOsc.type = 'sine';
      flashOsc.frequency.setValueAtTime(2200, safeWhen + 0.02);
      flashOsc.frequency.exponentialRampToValueAtTime(4800, safeWhen + 0.18);
      fg.gain.setValueAtTime(0.18, safeWhen + 0.02);
      fg.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.2);
      flashOsc.connect(fg);
      fg.connect(master);
      flashOsc.start(safeWhen + 0.02);
      flashOsc.stop(safeWhen + 0.21);
      break;
    }

    case 'typing': {
      // Rapid keyboard / phone tap clicks (5 quick taps)
      for (let i = 0; i < 5; i++) {
        const t = safeWhen + i * 0.065;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(920 + (i % 3) * 180, t);
        osc.frequency.exponentialRampToValueAtTime(280, t + 0.025);
        g.gain.setValueAtTime(0.45, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.035);
      }
      break;
    }

    case 'telegraph': {
      // Classic Morse code dits & dahs
      const pattern = [0.06, 0.06, 0.16, 0.06];
      let cur = safeWhen;
      for (const dur of pattern) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1040, cur);
        g.gain.setValueAtTime(0.36, cur);
        g.gain.setValueAtTime(0.36, cur + dur - 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, cur + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(cur);
        osc.stop(cur + dur + 0.01);
        cur += dur + 0.05;
      }
      break;
    }

    case 'train': {
      // Vintage steam whistle two-tone + chug
      for (const freq of [523.25, 659.25]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, safeWhen);
        g.gain.setValueAtTime(0.001, safeWhen);
        g.gain.linearRampToValueAtTime(0.28, safeWhen + 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, safeWhen + 0.55);
        osc.connect(g);
        g.connect(master);
        osc.start(safeWhen);
        osc.stop(safeWhen + 0.56);
      }
      break;
    }

    case 'waves': {
      // Rolling ocean surf wash
      const dur = 0.85;
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBuffer(ctx, dur);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(320, safeWhen);
      lp.frequency.linearRampToValueAtTime(920, safeWhen + 0.35);
      lp.frequency.linearRampToValueAtTime(240, safeWhen + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, safeWhen);
      g.gain.linearRampToValueAtTime(0.35, safeWhen + 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, safeWhen + dur);
      src.connect(lp);
      lp.connect(g);
      g.connect(master);
      src.start(safeWhen);
      src.stop(safeWhen + dur);
      break;
    }

    case 'applause': {
      // Crisp filtered crowd applause burst
      const dur = 0.75;
      const src = ctx.createBufferSource();
      src.buffer = createNoiseBuffer(ctx, dur);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, safeWhen);
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, safeWhen);
      g.gain.linearRampToValueAtTime(0.38, safeWhen + 0.14);
      g.gain.exponentialRampToValueAtTime(0.001, safeWhen + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(safeWhen);
      src.stop(safeWhen + dur);
      break;
    }

    case 'crickets': {
      // Multi-chirp quiet night crickets
      for (const offset of [0, 0.24]) {
        const t = safeWhen + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4250, t);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.15);
      }
      break;
    }
  }
}

/** Audition all Foley SFX scheduled for the active scene in real time */
export async function previewSceneSfxOnly(scene: SceneData, sfxVolumeDb: number) {
  const ctx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const gain = dbToGain(sfxVolumeDb);
  const kinds = detectSfxKindsForScene(scene);
  kinds.slice(0, 4).forEach((k, idx) => {
    scheduleSfxSound(ctx, ctx.destination, k, ctx.currentTime + 0.05 + idx * 0.42, gain);
  });
  window.setTimeout(() => {
    ctx.close().catch(() => {});
  }, 2600);
}

/** Schedule Procedural Lo-Fi BGM with Auto-Ducking & Scene 4 Silent Freeze Cut */
export function scheduleLoFiBgm(
  ctx: BaseAudioContext,
  dest: AudioNode,
  startTimeOffset: number,
  activeDurationSec: number,
  bgmBaseGain: number,
  dubPeaks: number[] | null,
  autoDucking: boolean
) {
  if (activeDurationSec <= 0.3) return;

  const chords = [
    [261.63, 329.63, 392.0, 493.88],
    [220.0, 261.63, 329.63, 392.0],
    [293.66, 349.23, 440.0, 523.25],
    [196.0, 246.94, 293.66, 349.23],
  ];

  const bgmMaster = ctx.createGain();
  bgmMaster.connect(dest);

  const stepSec = 0.1;
  const steps = Math.floor(activeDurationSec / stepSec);
  for (let s = 0; s <= steps; s++) {
    const t = startTimeOffset + s * stepSec;
    let duckMult = 1.0;
    if (autoDucking && dubPeaks && dubPeaks.length > 0) {
      const peakIdx = Math.min(
        dubPeaks.length - 1,
        Math.floor(s * stepSec * 60)
      );
      if (dubPeaks[peakIdx] > 0.08) {
        duckMult = 0.5;
      }
    }
    bgmMaster.gain.setTargetAtTime(bgmBaseGain * duckMult, t, 0.04);
  }
  bgmMaster.gain.setValueAtTime(0, startTimeOffset + activeDurationSec);

  const beatDur = 0.5;
  const totalBeats = Math.floor(activeDurationSec / beatDur);

  for (let b = 0; b < totalBeats; b++) {
    const t = startTimeOffset + b * beatDur;
    const chord = chords[Math.floor(b / 4) % chords.length];

    if (b % 4 === 0) {
      const dur = Math.min(beatDur * 3.8, activeDurationSec - b * beatDur);
      if (dur > 0.08) {
        for (const freq of chord) {
          const osc = ctx.createOscillator();
          const cg = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          cg.gain.setValueAtTime(0.001, t);
          cg.gain.linearRampToValueAtTime(0.18, t + 0.05);
          cg.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(cg);
          cg.connect(bgmMaster);
          osc.start(t);
          osc.stop(t + dur + 0.02);
        }
      }
    }

    if (b % 2 === 0) {
      const kick = ctx.createOscillator();
      const kg = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(110, t);
      kick.frequency.exponentialRampToValueAtTime(44, t + 0.12);
      kg.gain.setValueAtTime(0.32, t);
      kg.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      kick.connect(kg);
      kg.connect(bgmMaster);
      kick.start(t);
      kick.stop(t + 0.15);
    }
  }
}

/** Bake complete mixed stereo AudioBuffer (Dubbing + Lo-Fi BGM + Beat-Synced Foley SFX) */
export async function renderMixedEpisodeAudio(
  episode: EpisodeData,
  audioState: EpisodeAudioState,
  mixer: MixerSettings,
  target: 'full-episode' | 1 | 2 | 3 | 4
): Promise<{ buffer: AudioBuffer; peaks: number[]; totalDuration: number }> {
  const { sceneDurations, sceneOffsets } = computeAudioTimeline(
    episode,
    audioState
  );
  const sampleRate = 48000;

  let totalDuration = 0;
  let scenesToMix: {
    scene: SceneData;
    startOffset: number;
    dur: number;
    slotIdx: 1 | 2 | 3 | 4;
  }[] = [];

  if (target === 'full-episode') {
    totalDuration = sceneDurations.reduce((a, b) => a + b, 0);
    scenesToMix = [0, 1, 2, 3].map((i) => ({
      scene: episode.scenes[i],
      startOffset: sceneOffsets[i],
      dur: sceneDurations[i],
      slotIdx: (i + 1) as 1 | 2 | 3 | 4,
    }));
  } else {
    const idx = target - 1;
    totalDuration = sceneDurations[idx];
    scenesToMix = [
      {
        scene: episode.scenes[idx],
        startOffset: 0,
        dur: sceneDurations[idx],
        slotIdx: target,
      },
    ];
  }

  const off = new OfflineAudioContext(
    2,
    Math.max(1, Math.ceil(totalDuration * sampleRate)),
    sampleRate
  );

  // 1. Dubbing track at 0 dB
  const dubGain = off.createGain();
  dubGain.gain.value = dbToGain(mixer.dubbingVolumeDb);
  dubGain.connect(off.destination);

  let combinedPeaks: number[] = [];

  if (audioState.mode === 'full-episode' && audioState.fullAudio) {
    const src = off.createBufferSource();
    src.buffer = audioState.fullAudio.buffer;
    src.connect(dubGain);
    if (target === 'full-episode') {
      src.start(0);
      combinedPeaks = audioState.fullAudio.peaks;
    } else {
      const idx = target - 1;
      src.start(0, sceneOffsets[idx], sceneDurations[idx]);
      const startP = Math.floor(sceneOffsets[idx] * 60);
      const endP = Math.floor((sceneOffsets[idx] + sceneDurations[idx]) * 60);
      combinedPeaks = audioState.fullAudio.peaks.slice(startP, endP);
    }
  } else if (audioState.mode === 'per-scene') {
    for (const item of scenesToMix) {
      const slot = audioState.sceneAudios[item.slotIdx];
      const expectedSamples = Math.max(1, Math.round(item.dur * 60));
      if (slot) {
        const src = off.createBufferSource();
        src.buffer = slot.buffer;
        src.connect(dubGain);
        src.start(item.startOffset, 0, item.dur);
        for (let i = 0; i < expectedSamples; i++) {
          combinedPeaks.push(slot.peaks[i] ?? 0);
        }
      } else {
        for (let i = 0; i < expectedSamples; i++) {
          combinedPeaks.push(0);
        }
      }
    }
  }

  // 2. Procedural Lo-Fi BGM (-18 dB + auto-ducking, cuts cleanly before last 1s freeze of Scene 4)
  if (mixer.bgmEnabled) {
    const s4FreezeCut =
      target === 'full-episode' || target === 4
        ? Math.min(1.0, sceneDurations[3] * 0.12)
        : 0;
    const bgmActiveDur = Math.max(0.2, totalDuration - s4FreezeCut);
    scheduleLoFiBgm(
      off,
      off.destination,
      0,
      bgmActiveDur,
      dbToGain(mixer.bgmVolumeDb),
      combinedPeaks,
      mixer.autoDucking
    );
  }

  // 3. Multi-Layered Beat-Synced Procedural Foley SFX (-10 dB default)
  if (mixer.sfxEnabled) {
    const sfxGainVal = dbToGain(mixer.sfxVolumeDb);
    for (const item of scenesToMix) {
      const freezeCut =
        item.scene.sceneNumber === 4 ? Math.min(1.0, item.dur * 0.12) : 0;
      const activeDur = Math.max(0.5, item.dur - freezeCut);
      const scriptMax = item.scene.sceneNumber === 4 ? 14 : 15;
      const kinds = detectSfxKindsForScene(item.scene);

      // Gate master sfx bus per scene so Scene 4 cuts cleanly on cliffhanger freeze
      const sceneSfxBus = off.createGain();
      sceneSfxBus.gain.setValueAtTime(1, item.startOffset);
      if (item.scene.sceneNumber === 4) {
        sceneSfxBus.gain.setValueAtTime(1, item.startOffset + activeDur - 0.02);
        sceneSfxBus.gain.linearRampToValueAtTime(0, item.startOffset + activeDur);
      }
      sceneSfxBus.connect(off.destination);

      // Transition sound at scene start
      if (item.scene.transitionIn === 'swipe-up') {
        scheduleSfxSound(off, sceneSfxBus, 'whoosh', item.startOffset + 0.02, sfxGainVal * 0.85);
      } else if (item.scene.transitionIn === 'glitch') {
        scheduleSfxSound(off, sceneSfxBus, 'scratch', item.startOffset + 0.02, sfxGainVal * 0.72);
      }

      // Opening chalk stroke if scene has a chalkMotif
      if (item.scene.chalkMotif) {
        scheduleSfxSound(off, sceneSfxBus, 'chalk', item.startOffset + 0.25, sfxGainVal * 0.75);
      }

      // Timeline beat-driven SFX
      item.scene.timeline.forEach((beat, bIdx) => {
        const beatTime =
          item.startOffset +
          Math.min(activeDur - 0.25, (beat.startSec / scriptMax) * activeDur);

        const detected =
          detectSfxFromText(beat.action + ' ' + beat.triggerWord) ??
          kinds[bIdx % kinds.length];

        scheduleSfxSound(off, sceneSfxBus, detected, beatTime, sfxGainVal * 0.88);

        if (beat.zoomKaget) {
          scheduleSfxSound(off, sceneSfxBus, 'boing', beatTime + 0.08, sfxGainVal * 0.9);
        }
      });

      // Pop-up spring chime at 9.5/15 for Scenes 1-3
      if (item.scene.sceneNumber !== 4) {
        const popTime = item.startOffset + (9.5 / 15) * activeDur;
        const popSfx: SfxKind =
          item.scene.popupTone === 'green' || item.scene.popupTone === 'yellow'
            ? 'ting'
            : 'pop';
        scheduleSfxSound(off, sceneSfxBus, popSfx, popTime, sfxGainVal * 0.92);
      } else {
        // Scene 4 Cek Fakta card & Cliffhanger Stamp SFX directly on destination right at stamp time
        const faktaTime = item.startOffset + (7 / 14) * activeDur;
        scheduleSfxSound(off, sceneSfxBus, 'ting', faktaTime, sfxGainVal * 0.88);
        scheduleSfxSound(off, sceneSfxBus, 'stamp', faktaTime + 0.06, sfxGainVal * 0.82);

        // Final cliffhanger slam right as silent freeze begins (short 0.18s stamp thud, followed by total silence!)
        scheduleSfxSound(
          off,
          off.destination,
          'stamp',
          item.startOffset + activeDur,
          sfxGainVal * 1.05
        );
      }
    }
  }

  const mixedBuffer = await off.startRendering();
  const finalPeaks =
    combinedPeaks.length > 0 ? combinedPeaks : extractAudioPeaks(mixedBuffer, 60);

  return {
    buffer: mixedBuffer,
    peaks: finalPeaks,
    totalDuration: mixedBuffer.duration,
  };
}
