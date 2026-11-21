import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { EpisodeAudioState, EpisodeData, MixerSettings } from '../types/studio';
import { computeAudioTimeline, renderMixedEpisodeAudio } from './audioEngine';
import { CANVAS_H, CANVAS_W } from './chalkAndFx';
import { renderStudioFrame } from './sceneDirector';

export interface ExportMp4Options {
  episode: EpisodeData;
  audioState: EpisodeAudioState;
  mixer: MixerSettings;
  target: 'full-episode' | 1 | 2 | 3 | 4;
  showSafeZone?: boolean;
  fps?: number;
  onProgress: (progressPct: number, stageLabel: string) => void;
}

export interface ExportMp4Result {
  blob: Blob;
  fileName: string;
  durationSec: number;
  mimeType: string;
}

async function pickSupportedVideoCodec(
  width: number,
  height: number,
  fps: number
): Promise<string | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const candidates = [
    'avc1.64002a', // H.264 High L4.2
    'avc1.4d002a', // H.264 Main L4.2
    'avc1.42002a', // H.264 Baseline L4.2
    'avc1.640028', // H.264 High L4.0
    'avc1.420028', // H.264 Baseline L4.0
  ];
  for (const codec of candidates) {
    try {
      const res = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate: 8_000_000,
        framerate: fps,
      });
      if (res.supported) return codec;
    } catch {
      // try next
    }
  }
  return null;
}

interface AudioCodecChoice {
  webCodecs: string;
  muxer: 'aac' | 'opus';
  chunkSamples: number;
}

async function pickSupportedAudioCodec(sampleRate: number): Promise<AudioCodecChoice | null> {
  if (typeof AudioEncoder === 'undefined') return null;
  const candidates: AudioCodecChoice[] = [
    { webCodecs: 'mp4a.40.2', muxer: 'aac', chunkSamples: 1024 },
    { webCodecs: 'opus', muxer: 'opus', chunkSamples: Math.round(sampleRate * 0.02) },
  ];
  for (const c of candidates) {
    try {
      const res = await AudioEncoder.isConfigSupported({
        codec: c.webCodecs,
        sampleRate,
        numberOfChannels: 2,
        bitrate: 192_000,
      });
      if (res.supported) return c;
    } catch {
      // try next audio codec
    }
  }
  return null;
}

export async function exportRealMp4Video(
  opts: ExportMp4Options
): Promise<ExportMp4Result> {
  const {
    episode,
    audioState,
    mixer,
    target,
    showSafeZone = false,
    fps = 30,
    onProgress,
  } = opts;

  onProgress(2, 'Menyiapkan mixer audio & sinkronisasi timeline…');

  const { sceneDurations } = computeAudioTimeline(episode, audioState);
  const mixed = await renderMixedEpisodeAudio(
    episode,
    audioState,
    mixer,
    target
  );
  const totalDuration = mixed.totalDuration;
  const totalFrames = Math.max(1, Math.ceil(totalDuration * fps));

  const epTag = `Ep${String(episode.id).padStart(2, '0')}`;
  const sceneTag = target === 'full-episode' ? 'Full' : `S${target}`;
  const baseFileName = `Einstein_${epTag}_${sceneTag}_1080x1920`;

  const videoCodec = await pickSupportedVideoCodec(CANVAS_W, CANVAS_H, fps);
  const audioCodec = await pickSupportedAudioCodec(mixed.buffer.sampleRate);

  if (videoCodec && audioCodec) {
    return exportViaWebCodecsMp4({
      episode,
      sceneDurations,
      target,
      showSafeZone,
      fps,
      totalFrames,
      totalDuration,
      mixedBuffer: mixed.buffer,
      peaks: mixed.peaks,
      videoCodec,
      audioCodec,
      fileName: `${baseFileName}.mp4`,
      onProgress,
    });
  }

  // Fallback: MediaRecorder real-time capture (prefers video/mp4 if supported)
  return exportViaMediaRecorderFallback({
    episode,
    sceneDurations,
    target,
    showSafeZone,
    fps,
    totalDuration,
    mixedBuffer: mixed.buffer,
    peaks: mixed.peaks,
    baseFileName,
    onProgress,
  });
}

async function exportViaWebCodecsMp4(params: {
  episode: EpisodeData;
  sceneDurations: [number, number, number, number];
  target: 'full-episode' | 1 | 2 | 3 | 4;
  showSafeZone: boolean;
  fps: number;
  totalFrames: number;
  totalDuration: number;
  mixedBuffer: AudioBuffer;
  peaks: number[];
  videoCodec: string;
  audioCodec: AudioCodecChoice;
  fileName: string;
  onProgress: (pct: number, label: string) => void;
}): Promise<ExportMp4Result> {
  const {
    episode,
    sceneDurations,
    target,
    showSafeZone,
    fps,
    totalFrames,
    totalDuration,
    mixedBuffer,
    peaks,
    videoCodec,
    audioCodec,
    fileName,
    onProgress,
  } = params;

  const targetBuf = new ArrayBufferTarget();
  const muxer = new Muxer({
    target: targetBuf,
    video: {
      codec: 'avc',
      width: CANVAS_W,
      height: CANVAS_H,
    },
    audio: {
      codec: audioCodec.muxer,
      numberOfChannels: 2,
      sampleRate: mixedBuffer.sampleRate,
    },
    fastStart: 'in-memory',
  });

  let encoderError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  videoEncoder.configure({
    codec: videoCodec,
    width: CANVAS_W,
    height: CANVAS_H,
    bitrate: 8_000_000,
    framerate: fps,
  });

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => {
      muxer.addAudioChunk(chunk, meta);
    },
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  audioEncoder.configure({
    codec: audioCodec.webCodecs,
    sampleRate: mixedBuffer.sampleRate,
    numberOfChannels: 2,
    bitrate: 192_000,
  });

  // 1. Encode AudioBuffer in fixed frames (1024 for AAC, 960 for Opus)
  onProgress(8, `Mengenkode trek audio ${audioCodec.muxer.toUpperCase()} 48kHz…`);
  const chLeft = mixedBuffer.getChannelData(0);
  const chRight =
    mixedBuffer.numberOfChannels > 1
      ? mixedBuffer.getChannelData(1)
      : chLeft;
  const totalSamples = mixedBuffer.length;
  const chunkSamples = audioCodec.chunkSamples;

  for (let offset = 0; offset < totalSamples; offset += chunkSamples) {
    if (encoderError) throw encoderError;
    const len = Math.min(chunkSamples, totalSamples - offset);
    const planar = new Float32Array(len * 2);
    planar.set(chLeft.subarray(offset, offset + len), 0);
    planar.set(chRight.subarray(offset, offset + len), len);

    const timestampUs = Math.round((offset / mixedBuffer.sampleRate) * 1_000_000);
    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate: mixedBuffer.sampleRate,
      numberOfFrames: len,
      numberOfChannels: 2,
      timestamp: timestampUs,
      data: planar,
    });
    audioEncoder.encode(audioData);
    audioData.close();

    if (offset % (chunkSamples * 32) === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // 2. Render & Encode 1080x1920 Video Frames deterministically
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  for (let f = 0; f < totalFrames; f++) {
    if (encoderError) throw encoderError;

    const timeSec = f / fps;
    const peakIdx = Math.min(
      Math.max(0, peaks.length - 1),
      Math.floor(timeSec * 60)
    );
    const amp = peaks[peakIdx] ?? 0.25;

    renderStudioFrame(ctx, {
      episode,
      localTimeSec: timeSec,
      sceneDurations,
      target,
      audioAmplitude: amp,
      showSafeZone,
    });

    const timestampUs = Math.round((f / fps) * 1_000_000);
    const durationUs = Math.round((1 / fps) * 1_000_000);
    const frame = new VideoFrame(canvas, {
      timestamp: timestampUs,
      duration: durationUs,
    });

    const isKeyFrame = f % (fps * 2) === 0;
    videoEncoder.encode(frame, { keyFrame: isKeyFrame });
    frame.close();

    // Backpressure guard & UI yield
    while (videoEncoder.encodeQueueSize > 8) {
      await new Promise((r) => setTimeout(r, 4));
    }

    if (f % 6 === 0 || f === totalFrames - 1) {
      const pct = 12 + Math.round(((f + 1) / totalFrames) * 82);
      onProgress(
        pct,
        `Merender HD 1080×1920 · Frame ${f + 1}/${totalFrames}`
      );
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress(96, 'Menyelesaikan muxing kontainer .MP4…');
  await Promise.all([videoEncoder.flush(), audioEncoder.flush()]);
  videoEncoder.close();
  audioEncoder.close();
  muxer.finalize();

  const blob = new Blob([targetBuf.buffer], { type: 'video/mp4' });
  onProgress(100, 'Ekspor .MP4 selesai!');

  return {
    blob,
    fileName,
    durationSec: totalDuration,
    mimeType: 'video/mp4',
  };
}

async function exportViaMediaRecorderFallback(params: {
  episode: EpisodeData;
  sceneDurations: [number, number, number, number];
  target: 'full-episode' | 1 | 2 | 3 | 4;
  showSafeZone: boolean;
  fps: number;
  totalDuration: number;
  mixedBuffer: AudioBuffer;
  peaks: number[];
  baseFileName: string;
  onProgress: (pct: number, label: string) => void;
}): Promise<ExportMp4Result> {
  const {
    episode,
    sceneDurations,
    target,
    showSafeZone,
    fps,
    totalDuration,
    mixedBuffer,
    peaks,
    baseFileName,
    onProgress,
  } = params;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const audioCtx = new AudioContext({ sampleRate: mixedBuffer.sampleRate });
  const src = audioCtx.createBufferSource();
  src.buffer = mixedBuffer;
  const dest = audioCtx.createMediaStreamDestination();
  src.connect(dest);

  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeCandidates = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm',
  ];
  const mimeType =
    mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
    audioBitsPerSecond: 192_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<ExportMp4Result>((resolve, reject) => {
    recorder.onerror = (e) => reject(e);
    recorder.onstop = async () => {
      await audioCtx.close();
      const blob = new Blob(chunks, { type: mimeType });
      onProgress(100, 'Ekspor video selesai!');
      resolve({
        blob,
        fileName: `${baseFileName}.${ext}`,
        durationSec: totalDuration,
        mimeType,
      });
    };

    recorder.start(250);
    src.start(0);
    const startMs = performance.now();

    const step = () => {
      const elapsed = (performance.now() - startMs) / 1000;
      if (elapsed >= totalDuration) {
        recorder.stop();
        return;
      }
      const peakIdx = Math.min(
        Math.max(0, peaks.length - 1),
        Math.floor(elapsed * 60)
      );
      renderStudioFrame(ctx, {
        episode,
        localTimeSec: elapsed,
        sceneDurations,
        target,
        audioAmplitude: peaks[peakIdx] ?? 0.2,
        showSafeZone,
      });
      const pct = Math.min(98, Math.round((elapsed / totalDuration) * 100));
      onProgress(pct, `Merekam stream HD (${elapsed.toFixed(1)}s / ${totalDuration.toFixed(1)}s)…`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
