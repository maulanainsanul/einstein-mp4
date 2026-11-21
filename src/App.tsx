import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileAudio,
  Film,
  Loader2,
  Play,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { CharacterGallery } from './components/CharacterGallery';
import { GuidePanel } from './components/GuidePanel';
import { JsonEditorPanel } from './components/JsonEditorPanel';
import { StudioCanvas } from './components/StudioCanvas';
import { ALL_EPISODES } from './data/episodes';
import {
  computeAudioTimeline,
  createProceduralDemoSlot,
  decodeUploadedAudioFile,
  previewSceneSfxOnly,
  renderMixedEpisodeAudio,
} from './engine/audioEngine';
import { exportRealMp4Video } from './engine/mp4Exporter';
import { resolvePlaybackPoint } from './engine/sceneDirector';
import {
  AudioUploadMode,
  EpisodeAudioState,
  EpisodeData,
  MixerSettings,
  RenderExportState,
} from './types/studio';

type WorkspaceTab = 'studio' | 'gallery' | 'json' | 'guide';

function createInitialAudioState(): EpisodeAudioState {
  return {
    mode: 'per-scene',
    fullAudio: null,
    sceneAudios: { 1: null, 2: null, 3: null, 4: null },
    splitMethod: 'proportional',
    sceneDurations: [15, 15, 15, 15],
    sceneOffsets: [0, 15, 30, 45],
  };
}

function downsamplePeaks(peaks: number[], barCount = 36): number[] {
  if (peaks.length === 0) return Array(barCount).fill(0.1);
  const out: number[] = [];
  const step = peaks.length / barCount;
  for (let i = 0; i < barCount; i++) {
    const start = Math.floor(i * step);
    const end = Math.max(start + 1, Math.floor((i + 1) * step));
    let max = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      if (peaks[j] > max) max = peaks[j];
    }
    out.push(Math.max(0.08, Math.min(1, max)));
  }
  return out;
}

export default function App() {
  const [episodes, setEpisodes] = useState<EpisodeData[]>(() =>
    structuredClone(ALL_EPISODES)
  );
  const [selectedEpId, setSelectedEpId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');
  const [renderTarget, setRenderTarget] = useState<'full-episode' | 1 | 2 | 3 | 4>('full-episode');
  const [rightTab, setRightTab] = useState<'audio' | 'script' | 'mixer'>('audio');

  // Audio state stored per episode ID
  const [audioByEp, setAudioByEp] = useState<Record<number, EpisodeAudioState>>({});
  const [mixer, setMixer] = useState<MixerSettings>({
    dubbingVolumeDb: 0,
    bgmVolumeDb: -18,
    sfxVolumeDb: -10,
    bgmEnabled: true,
    sfxEnabled: true,
    autoDucking: true,
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [dragOverScene, setDragOverScene] = useState<number | null>(null);
  const [dragOverBatch, setDragOverBatch] = useState(false);

  // Export state
  const [exportState, setExportState] = useState<RenderExportState>({
    isExporting: false,
    progress: 0,
    stageLabel: '',
    target: 'full-episode',
    error: null,
    lastExportUrl: null,
    lastExportFileName: null,
  });

  // Playback refs for Web Audio sync
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const peaksRef = useRef<number[]>([]);
  const playStartCtxTimeRef = useRef<number>(0);
  const playStartWallMsRef = useRef<number>(0);
  const playStartOffsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const skipResetOnTargetRef = useRef<boolean>(false);

  const currentEpisode = useMemo(
    () => episodes.find((e) => e.id === selectedEpId) ?? episodes[0],
    [episodes, selectedEpId]
  );

  const rawAudioState = audioByEp[selectedEpId] ?? createInitialAudioState();

  const computedTimeline = useMemo(
    () => computeAudioTimeline(currentEpisode, rawAudioState),
    [currentEpisode, rawAudioState]
  );

  const sceneDurations = computedTimeline.sceneDurations;

  const totalDurationSec = useMemo(() => {
    if (renderTarget === 'full-episode') {
      return sceneDurations.reduce((a, b) => a + b, 0);
    }
    return sceneDurations[renderTarget - 1];
  }, [renderTarget, sceneDurations]);

  const stopAudioPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioSrcRef.current) {
      try {
        audioSrcRef.current.stop();
        audioSrcRef.current.disconnect();
      } catch {
        // ignore already stopped
      }
      audioSrcRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAudioPlayback]);

  // Reset playback when episode or target changes
  useEffect(() => {
    if (skipResetOnTargetRef.current) {
      skipResetOnTargetRef.current = false;
      return;
    }
    stopAudioPlayback();
    setIsPlaying(false);
    setCurrentTimeSec(0);
    peaksRef.current = [];
  }, [selectedEpId, renderTarget, stopAudioPlayback]);

  // Sync mute state
  useEffect(() => {
    if (audioGainRef.current && audioCtxRef.current) {
      audioGainRef.current.gain.setValueAtTime(
        isMuted ? 0 : 1,
        audioCtxRef.current.currentTime
      );
    }
  }, [isMuted]);

  const startPlaybackFrom = useCallback(
    async (
      startSec: number,
      overrideTarget?: 'full-episode' | 1 | 2 | 3 | 4
    ) => {
      stopAudioPlayback();
      const effectiveTarget = overrideTarget ?? renderTarget;
      const targetDur =
        effectiveTarget === 'full-episode'
          ? sceneDurations.reduce((a, b) => a + b, 0)
          : sceneDurations[effectiveTarget - 1];
      const clampedStart = Math.max(
        0,
        Math.min(Math.max(0, targetDur - 0.05), startSec)
      );

      try {
        const mixed = await renderMixedEpisodeAudio(
          currentEpisode,
          rawAudioState,
          mixer,
          effectiveTarget
        );
        peaksRef.current = mixed.peaks;

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const gain = ctx.createGain();
        gain.gain.value = isMuted ? 0 : 1;
        gain.connect(ctx.destination);
        audioGainRef.current = gain;

        const src = ctx.createBufferSource();
        src.buffer = mixed.buffer;
        src.connect(gain);
        src.start(0, clampedStart);

        audioSrcRef.current = src;
        playStartCtxTimeRef.current = ctx.currentTime;
        playStartWallMsRef.current = performance.now();
        playStartOffsetRef.current = clampedStart;
        setIsPlaying(true);

        const tick = () => {
          if (!audioCtxRef.current) return;
          const audioDelta =
            audioCtxRef.current.currentTime - playStartCtxTimeRef.current;
          const wallDelta =
            (performance.now() - playStartWallMsRef.current) / 1000;
          const delta = audioDelta > 0.02 ? audioDelta : wallDelta;
          const elapsed = playStartOffsetRef.current + delta;
          if (elapsed >= targetDur) {
            setCurrentTimeSec(targetDur);
            stopAudioPlayback();
            setIsPlaying(false);
            return;
          }
          setCurrentTimeSec(elapsed);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        setAudioError(
          e instanceof Error ? e.message : 'Gagal memutar audio mixer.'
        );
        setIsPlaying(false);
      }
    },
    [
      currentEpisode,
      isMuted,
      mixer,
      rawAudioState,
      renderTarget,
      sceneDurations,
      stopAudioPlayback,
    ]
  );

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      stopAudioPlayback();
      setIsPlaying(false);
    } else {
      const startAt =
        currentTimeSec >= totalDurationSec - 0.1 ? 0 : currentTimeSec;
      startPlaybackFrom(startAt);
    }
  }, [
    currentTimeSec,
    isPlaying,
    startPlaybackFrom,
    stopAudioPlayback,
    totalDurationSec,
  ]);

  const handleRestart = useCallback(() => {
    setCurrentTimeSec(0);
    if (isPlaying) {
      startPlaybackFrom(0);
    }
  }, [isPlaying, startPlaybackFrom]);

  const handleSeek = useCallback(
    (timeSec: number) => {
      const clamped = Math.max(0, Math.min(totalDurationSec, timeSec));
      setCurrentTimeSec(clamped);
      if (isPlaying) {
        startPlaybackFrom(clamped);
      }
    },
    [isPlaying, startPlaybackFrom, totalDurationSec]
  );

  const updateEpAudio = useCallback(
    (updater: (prev: EpisodeAudioState) => EpisodeAudioState) => {
      setAudioByEp((prev) => {
        const cur = prev[selectedEpId] ?? createInitialAudioState();
        return { ...prev, [selectedEpId]: updater(cur) };
      });
    },
    [selectedEpId]
  );

  const handleUploadFullAudio = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBusy(true);
    setAudioError(null);
    try {
      const slot = await decodeUploadedAudioFile(file);
      updateEpAudio((cur) => ({
        ...cur,
        mode: 'full-episode',
        fullAudio: slot,
      }));
      setCurrentTimeSec(0);
    } catch {
      setAudioError(
        'Gagal membaca file audio. Pastikan format .mp3 atau .wav valid.'
      );
    } finally {
      setAudioBusy(false);
      e.target.value = '';
    }
  };

  const processSingleSceneFile = async (
    sceneNum: 1 | 2 | 3 | 4,
    file: File
  ) => {
    setAudioBusy(true);
    setAudioError(null);
    try {
      const slot = await decodeUploadedAudioFile(file);
      updateEpAudio((cur) => ({
        ...cur,
        mode: 'per-scene',
        sceneAudios: { ...cur.sceneAudios, [sceneNum]: slot },
      }));
      setCurrentTimeSec(0);
    } catch {
      setAudioError(`Gagal membaca file audio Scene ${sceneNum}. Pastikan format .mp3 atau .wav valid.`);
    } finally {
      setAudioBusy(false);
    }
  };

  const handleUploadSceneAudio = async (
    sceneNum: 1 | 2 | 3 | 4,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processSingleSceneFile(sceneNum, file);
  };

  const handleSceneDrop = async (
    sceneNum: 1 | 2 | 3 | 4,
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    setDragOverScene(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processSingleSceneFile(sceneNum, file);
  };

  const processBatchSceneFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name))
      .slice(0, 4);

    if (files.length === 0) {
      setAudioError('Tidak ada file audio valid (.mp3 / .wav) yang ditemukan.');
      return;
    }

    setAudioBusy(true);
    setAudioError(null);

    try {
      const assigned: Partial<Record<1 | 2 | 3 | 4, File>> = {};
      const unassigned: File[] = [];

      for (const file of files) {
        const match =
          file.name.match(/(?:scene|sc|s)[\s._-]*([1-4])\b/i) ??
          file.name.match(/[_\-. ]([1-4])(?=\.[^.]+$)/);
        const num = match ? (Number(match[1]) as 1 | 2 | 3 | 4) : null;
        if (num && !assigned[num]) {
          assigned[num] = file;
        } else {
          unassigned.push(file);
        }
      }

      unassigned.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      for (const sNum of [1, 2, 3, 4] as const) {
        if (!assigned[sNum] && unassigned.length > 0) {
          const next = unassigned.shift();
          if (next) assigned[sNum] = next;
        }
      }

      const entries = await Promise.all(
        (Object.entries(assigned) as [string, File][]).map(async ([k, f]) => ({
          sceneNum: Number(k) as 1 | 2 | 3 | 4,
          slot: await decodeUploadedAudioFile(f),
        }))
      );

      updateEpAudio((cur) => {
        const nextScenes = { ...cur.sceneAudios };
        for (const item of entries) {
          nextScenes[item.sceneNum] = item.slot;
        }
        return {
          ...cur,
          mode: 'per-scene',
          sceneAudios: nextScenes,
        };
      });
      setCurrentTimeSec(0);
    } catch {
      setAudioError('Sebagian atau seluruh file audio gagal didekode. Pastikan format .mp3 / .wav valid.');
    } finally {
      setAudioBusy(false);
    }
  };

  const handleBatchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    await processBatchSceneFiles(files);
    e.target.value = '';
  };

  const handleBatchDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverBatch(false);
    await processBatchSceneFiles(e.dataTransfer.files);
  };

  const handlePreviewScene = (sceneNum: 1 | 2 | 3 | 4) => {
    if (renderTarget !== 'full-episode') {
      if (renderTarget !== sceneNum) {
        skipResetOnTargetRef.current = true;
        setRenderTarget(sceneNum);
      }
      setCurrentTimeSec(0);
      startPlaybackFrom(0, sceneNum);
      return;
    }
    const offset = computedTimeline.sceneOffsets[sceneNum - 1];
    setCurrentTimeSec(offset);
    startPlaybackFrom(offset, 'full-episode');
  };

  const handleGenerateDemoAudio = async (demoDur = 50) => {
    setAudioBusy(true);
    setAudioError(null);
    try {
      const slot = await createProceduralDemoSlot(currentEpisode, demoDur);
      updateEpAudio((cur) => ({
        ...cur,
        mode: 'full-episode',
        fullAudio: slot,
      }));
      setCurrentTimeSec(0);
    } catch {
      setAudioError('Gagal membuat audio demo.');
    } finally {
      setAudioBusy(false);
    }
  };

  const handleExportMp4 = async (
    overrideTarget?: 'full-episode' | 1 | 2 | 3 | 4
  ) => {
    if (exportState.isExporting) return;
    const effectiveTarget = overrideTarget ?? renderTarget;
    if (overrideTarget && overrideTarget !== renderTarget) {
      setRenderTarget(overrideTarget);
    }
    stopAudioPlayback();
    setIsPlaying(false);

    if (exportState.lastExportUrl) {
      URL.revokeObjectURL(exportState.lastExportUrl);
    }

    setExportState({
      isExporting: true,
      progress: 1,
      stageLabel: 'Memulai render HD 1080×1920…',
      target: effectiveTarget,
      error: null,
      lastExportUrl: null,
      lastExportFileName: null,
    });

    try {
      const res = await exportRealMp4Video({
        episode: currentEpisode,
        audioState: rawAudioState,
        mixer,
        target: effectiveTarget,
        showSafeZone: false,
        fps: 30,
        onProgress: (progress, stageLabel) => {
          setExportState((prev) => ({
            ...prev,
            progress,
            stageLabel,
          }));
        },
      });

      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportState({
        isExporting: false,
        progress: 100,
        stageLabel: `Berhasil! ${res.fileName} (${res.durationSec.toFixed(1)} dtk)`,
        target: effectiveTarget,
        error: null,
        lastExportUrl: url,
        lastExportFileName: res.fileName,
      });
    } catch (err) {
      setExportState({
        isExporting: false,
        progress: 0,
        stageLabel: '',
        target: effectiveTarget,
        error:
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat mengekspor video .MP4.',
        lastExportUrl: null,
        lastExportFileName: null,
      });
    }
  };

  const handleSaveEpisodeJson = (updated: EpisodeData) => {
    setEpisodes((prev) =>
      prev.map((ep) => (ep.id === updated.id ? updated : ep))
    );
  };

  const handleResetEpisodeJson = (epId: number) => {
    const original = ALL_EPISODES.find((e) => e.id === epId);
    if (!original) return;
    setEpisodes((prev) =>
      prev.map((ep) => (ep.id === epId ? structuredClone(original) : ep))
    );
  };

  const activePoint = resolvePlaybackPoint(
    currentEpisode,
    currentTimeSec,
    sceneDurations,
    renderTarget
  );

  // Current live audio amplitude for narrator mic wave
  const liveAmplitude = useMemo(() => {
    if (peaksRef.current.length > 0) {
      const idx = Math.min(
        peaksRef.current.length - 1,
        Math.max(0, Math.floor(currentTimeSec * 60))
      );
      return peaksRef.current[idx] ?? 0.25;
    }
    if (rawAudioState.mode === 'per-scene') {
      const slot = rawAudioState.sceneAudios[activePoint.scene.sceneNumber];
      if (slot && slot.peaks.length > 0) {
        const idx = Math.min(
          slot.peaks.length - 1,
          Math.max(0, Math.floor(activePoint.sceneElapsed * 60))
        );
        return slot.peaks[idx] ?? 0.15;
      }
    } else if (rawAudioState.fullAudio && rawAudioState.fullAudio.peaks.length > 0) {
      const baseOffset =
        renderTarget === 'full-episode'
          ? currentTimeSec
          : computedTimeline.sceneOffsets[renderTarget - 1] + currentTimeSec;
      const idx = Math.min(
        rawAudioState.fullAudio.peaks.length - 1,
        Math.max(0, Math.floor(baseOffset * 60))
      );
      return rawAudioState.fullAudio.peaks[idx] ?? 0.15;
    }
    return isPlaying
      ? 0.25 + 0.55 * Math.abs(Math.sin(currentTimeSec * 9.5))
      : 0.12;
  }, [
    activePoint.scene.sceneNumber,
    activePoint.sceneElapsed,
    computedTimeline.sceneOffsets,
    currentTimeSec,
    isPlaying,
    rawAudioState.fullAudio,
    rawAudioState.mode,
    rawAudioState.sceneAudios,
    renderTarget,
  ]);

  const activeScene = activePoint.scene;
  const activeSceneDuration = sceneDurations[activePoint.sceneIndex];
  const activeSceneScale =
    activeSceneDuration / (activeScene.sceneNumber === 4 ? 15 : 15);

  const copyNarration = (sceneNum: number, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedScene(sceneNum);
    setTimeout(() => setCopiedScene(null), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-[#F1F5F9]">
      {/* TOP BAR CONTRACT: 3 Zones separated by gap-8 */}
      <header className="h-14 border-b border-slate-800 bg-[#0D1526] px-6 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Single text wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('studio');
          }}
          className="text-base font-extrabold tracking-tight text-[#FFD60A] whitespace-nowrap shrink-0 font-display"
        >
          Einstein Studio
        </a>

        {/* Zone 2: Clean single-line text nav links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          {(
            [
              ['studio', 'Studio Timeline'],
              ['gallery', 'Pustaka Karakter'],
              ['json', 'JSON Editor'],
              ['guide', 'Panduan Produksi'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === key
                  ? 'border-[#FFD60A] text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <button
          type="button"
          onClick={() => handleExportMp4()}
          disabled={exportState.isExporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFD60A] hover:bg-[#FACC15] disabled:opacity-60 text-[#0F1B2D] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {exportState.isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Merender {exportState.progress}%</span>
            </>
          ) : (
            <>
              <Film className="w-3.5 h-3.5" />
              <span>
                Export .MP4 ({renderTarget === 'full-episode' ? 'Full' : `S${renderTarget}`})
              </span>
            </>
          )}
        </button>
      </header>

      {/* Export Progress / Result Banner */}
      {(exportState.isExporting ||
        exportState.lastExportUrl ||
        exportState.error) && (
        <div className="border-b border-slate-800 bg-slate-900/95 px-6 py-2.5 flex items-center justify-between gap-4 text-xs">
          {exportState.error ? (
            <span className="text-rose-400">{exportState.error}</span>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-slate-200 font-medium truncate">
                {exportState.stageLabel}
              </span>
              {exportState.isExporting && (
                <div className="w-56 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-[#FFD60A] transition-all duration-150"
                    style={{ width: `${exportState.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {exportState.lastExportUrl && exportState.lastExportFileName && (
            <a
              href={exportState.lastExportUrl}
              download={exportState.lastExportFileName}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#17BF63] text-[#0F1B2D] font-bold whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Ulang {exportState.lastExportFileName}</span>
            </a>
          )}
        </div>
      )}

      {/* MAIN VIEWPORT */}
      {activeTab === 'gallery' && (
        <main className="flex-1 overflow-y-auto">
          <CharacterGallery />
        </main>
      )}

      {activeTab === 'json' && (
        <main className="flex-1 overflow-y-auto">
          <JsonEditorPanel
            episode={currentEpisode}
            onSaveEpisode={handleSaveEpisodeJson}
            onResetEpisode={handleResetEpisodeJson}
          />
        </main>
      )}

      {activeTab === 'guide' && (
        <main className="flex-1 overflow-y-auto">
          <GuidePanel />
        </main>
      )}

      {activeTab === 'studio' && (
        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr_420px]">
          {/* LEFT SIDEBAR: 14 Episodes */}
          <aside className="border-r border-slate-800 bg-[#0D1526] flex flex-col min-h-0 max-h-[calc(100vh-3.5rem)]">
            <div className="px-4 py-3 border-b border-slate-800">
              <h2 className="text-xs font-bold text-slate-300">
                14 Episode · 56 Scene
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Einstein: Kisah yang Sebenarnya
              </p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
              {episodes.map((ep) => {
                const epAudio = audioByEp[ep.id];
                const sceneCount = epAudio
                  ? ([1, 2, 3, 4] as const).filter((n) => Boolean(epAudio.sceneAudios[n])).length
                  : 0;
                const hasFull = Boolean(epAudio?.fullAudio);
                const audioStatus =
                  epAudio?.mode === 'full-episode' && hasFull
                    ? 'Full Siap'
                    : sceneCount > 0
                    ? `${sceneCount}/4 Scene`
                    : hasFull
                    ? 'Full Siap'
                    : null;
                const selected = ep.id === selectedEpId;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => setSelectedEpId(ep.id)}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-slate-800/80'
                        : 'hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span
                        className={`font-mono-tabular font-semibold ${
                          selected ? 'text-[#FFD60A]' : 'text-slate-400'
                        }`}
                      >
                        Episode {String(ep.id).padStart(2, '0')}
                      </span>
                      {audioStatus && (
                        <span className="font-mono-tabular text-[#17BF63] font-medium">
                          {audioStatus}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-100 mt-0.5 line-clamp-1">
                      {ep.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      Mitos: {ep.mythBusted}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* CENTER STAGE: 1080x1920 Live Preview */}
          <section className="bg-[#0B1120] flex flex-col min-h-0 max-h-[calc(100vh-3.5rem)] overflow-hidden">
            <StudioCanvas
              episode={currentEpisode}
              currentTimeSec={currentTimeSec}
              totalDurationSec={totalDurationSec}
              sceneDurations={sceneDurations}
              target={renderTarget}
              isPlaying={isPlaying}
              isMuted={isMuted}
              showSafeZone={showSafeZone}
              audioAmplitude={liveAmplitude}
              onTogglePlay={handleTogglePlay}
              onRestart={handleRestart}
              onSeek={handleSeek}
              onToggleMute={() => setIsMuted((m) => !m)}
              onToggleSafeZone={() => setShowSafeZone((s) => !s)}
              onTargetChange={(t) => setRenderTarget(t)}
            />
          </section>

          {/* RIGHT WORKBENCH: Audio Sync, Mixer & Keyframe Script Inspector */}
          <aside className="border-l border-slate-800 bg-[#0D1526] flex flex-col min-h-0 max-h-[calc(100vh-3.5rem)]">
            {/* Workbench Sub-tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-slate-800 flex items-center gap-1">
              {(
                [
                  ['audio', 'Audio & Sinkron'],
                  ['script', 'Alur & Naskah'],
                  ['mixer', 'Audio Mixer'],
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setRightTab(k)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    rightTab === k
                      ? 'bg-slate-800 text-[#FFD60A]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {rightTab === 'audio' && (
                <>
                  {/* Mode Switcher: Per Scene (Default) vs 1 File Utuh */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-200">
                      Mode Unggah Audio Dubbing (.mp3 / .wav)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                      {(
                        [
                          ['per-scene', 'Per Scene (4 Slot)'],
                          ['full-episode', '1 File Utuh (Episode)'],
                        ] as [AudioUploadMode, string][]
                      ).map(([modeKey, modeLabel]) => (
                        <button
                          key={modeKey}
                          type="button"
                          onClick={() =>
                            updateEpAudio((c) => ({ ...c, mode: modeKey }))
                          }
                          className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                            rawAudioState.mode === modeKey
                              ? 'bg-[#2D9CFF] text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {modeLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {audioError && (
                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-700 text-xs text-rose-200">
                      {audioError}
                    </div>
                  )}

                  {rawAudioState.mode === 'full-episode' ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">
                          Dubbing 1 Episode Utuh
                        </span>
                        <span className="font-mono-tabular text-xs text-[#FFD60A]">
                          {rawAudioState.fullAudio
                            ? `${rawAudioState.fullAudio.durationSec.toFixed(2)} dtk`
                            : 'Default 60.00 dtk'}
                        </span>
                      </div>

                      <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border border-dashed border-slate-600 hover:border-[#FFD60A] bg-slate-950/60 text-xs font-semibold text-slate-200 cursor-pointer transition-colors">
                        {audioBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#FFD60A]" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#FFD60A]" />
                        )}
                        <span>
                          {rawAudioState.fullAudio
                            ? 'Ganti File Audio (.mp3 / .wav)'
                            : 'Unggah File Dubbing (.mp3 / .wav)'}
                        </span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleUploadFullAudio}
                          className="hidden"
                        />
                      </label>

                      {rawAudioState.fullAudio ? (
                        <div className="flex items-center justify-between gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileAudio className="w-3.5 h-3.5 text-[#17BF63] shrink-0" />
                            <span className="truncate text-slate-300">
                              {rawAudioState.fullAudio.fileName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateEpAudio((c) => ({ ...c, fullAudio: null }))
                            }
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Hapus audio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleGenerateDemoAudio(50)}
                          disabled={audioBusy}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
                          <span>Buat Audio Demo 50 Detik untuk Uji Cepat</span>
                        </button>
                      )}

                      {/* Split method for 1-file mode */}
                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400">
                          Pembagian Timeline ke Scene 1–4:
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateEpAudio((c) => ({
                                ...c,
                                splitMethod: 'proportional',
                              }))
                            }
                            className={`py-1.5 px-2 rounded text-[11px] font-medium border cursor-pointer ${
                              rawAudioState.splitMethod === 'proportional'
                                ? 'border-[#FFD60A] bg-[#FFD60A]/10 text-[#FFD60A]'
                                : 'border-slate-700 text-slate-400'
                            }`}
                          >
                            Proporsional Kata
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateEpAudio((c) => ({
                                ...c,
                                splitMethod: 'silence-detect',
                              }))
                            }
                            className={`py-1.5 px-2 rounded text-[11px] font-medium border cursor-pointer ${
                              rawAudioState.splitMethod === 'silence-detect'
                                ? 'border-[#FFD60A] bg-[#FFD60A]/10 text-[#FFD60A]'
                                : 'border-slate-700 text-slate-400'
                            }`}
                          >
                            Deteksi Jeda Hening
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Per Scene 4 Slots + Batch Upload */
                    <div className="space-y-3">
                      {(() => {
                        const uploadedCount = ([1, 2, 3, 4] as const).filter(
                          (n) => Boolean(rawAudioState.sceneAudios[n])
                        ).length;
                        const totalEpSec = sceneDurations.reduce((a, b) => a + b, 0);

                        return (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverBatch(true);
                            }}
                            onDragLeave={() => setDragOverBatch(false)}
                            onDrop={handleBatchDrop}
                            className={`rounded-xl p-3 border transition-colors space-y-2 ${
                              dragOverBatch
                                ? 'border-[#2D9CFF] bg-[#2D9CFF]/10'
                                : 'border-slate-800 bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-slate-100">
                                Slot Dubbing Ep {String(selectedEpId).padStart(2, '0')}
                              </span>
                              <span className="font-mono-tabular text-[11px] text-slate-300">
                                <span
                                  className={
                                    uploadedCount === 4
                                      ? 'text-[#17BF63] font-bold'
                                      : 'text-[#FFD60A] font-semibold'
                                  }
                                >
                                  {uploadedCount}/4 Scene
                                </span>
                                {' · '}
                                <span>{totalEpSec.toFixed(2)} dtk</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-slate-600 hover:border-[#FFD60A] bg-slate-950/70 text-xs font-semibold text-slate-200 cursor-pointer transition-colors whitespace-nowrap">
                                {audioBusy ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD60A] shrink-0" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
                                )}
                                <span>Unggah 4 File Sekaligus / Tarik ke Sini</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="audio/*"
                                  onChange={handleBatchInput}
                                  className="hidden"
                                />
                              </label>
                              {uploadedCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEpAudio((c) => ({
                                      ...c,
                                      sceneAudios: {
                                        1: null,
                                        2: null,
                                        3: null,
                                        4: null,
                                      },
                                    }))
                                  }
                                  className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-600 text-[11px] font-medium text-slate-400 hover:text-rose-400 whitespace-nowrap shrink-0 cursor-pointer"
                                  title="Kosongkan seluruh slot scene"
                                >
                                  Reset
                                </button>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 leading-snug">
                              Otomatis memetakan nama file berisi <span className="font-mono-tabular text-slate-300">s1–s4</span> atau urut Scene 1–4.
                            </p>
                          </div>
                        );
                      })()}

                      {([1, 2, 3, 4] as const).map((sNum) => {
                        const slot = rawAudioState.sceneAudios[sNum];
                        const scene = currentEpisode.scenes[sNum - 1];
                        const isDragging = dragOverScene === sNum;
                        const isActiveScene = activePoint.sceneIndex === sNum - 1;
                        const bars = slot ? downsamplePeaks(slot.peaks, 36) : [];

                        return (
                          <div
                            key={sNum}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverScene(sNum);
                            }}
                            onDragLeave={() => setDragOverScene(null)}
                            onDrop={(e) => handleSceneDrop(sNum, e)}
                            className={`rounded-xl p-3 border space-y-2 transition-colors ${
                              isDragging
                                ? 'border-[#2D9CFF] bg-[#2D9CFF]/10'
                                : isActiveScene
                                ? 'border-slate-700 bg-slate-900'
                                : 'border-slate-800 bg-slate-900/90'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0 flex items-center gap-1.5">
                                <span className="font-mono-tabular font-bold text-[#FFD60A] shrink-0">
                                  S{sNum}
                                </span>
                                <span className="font-semibold text-slate-100 truncate">
                                  {scene.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`font-mono-tabular text-xs font-semibold ${
                                    slot ? 'text-[#17BF63]' : 'text-slate-400'
                                  }`}
                                >
                                  {sceneDurations[sNum - 1].toFixed(2)}s
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handlePreviewScene(sNum)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 whitespace-nowrap cursor-pointer"
                                  title={`Putar preview Scene ${sNum}`}
                                >
                                  <Play className="w-3 h-3 text-[#FFD60A]" />
                                  <span>Preview</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              “{scene.narration}”
                            </p>

                            {slot && (
                              <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 space-y-1.5">
                                <div className="flex items-center justify-between gap-2 text-[11px]">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FileAudio className="w-3.5 h-3.5 text-[#17BF63] shrink-0" />
                                    <span className="truncate text-slate-200 font-medium">
                                      {slot.fileName}
                                    </span>
                                  </div>
                                  <span className="font-mono-tabular text-slate-400 shrink-0">
                                    {slot.durationSec.toFixed(2)} dtk
                                  </span>
                                </div>
                                <div
                                  className="h-6 flex items-end gap-[2px]"
                                  aria-hidden="true"
                                >
                                  {bars.map((amp, bIdx) => (
                                    <div
                                      key={bIdx}
                                      className="flex-1 rounded-sm bg-[#2D9CFF]/80"
                                      style={{ height: `${Math.round(amp * 100)}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5">
                              <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-950 border border-dashed border-slate-700 hover:border-[#2D9CFF] text-xs font-medium text-slate-200 cursor-pointer truncate">
                                <Upload className="w-3.5 h-3.5 text-[#2D9CFF] shrink-0" />
                                <span className="truncate">
                                  {slot
                                    ? 'Ganti Audio Scene'
                                    : `Unggah / Tarik Dubbing S${sNum}`}
                                </span>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleUploadSceneAudio(sNum, e)}
                                  className="hidden"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => copyNarration(sNum, scene.narration)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-[11px] font-medium text-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
                                title="Salin teks narasi dubbing untuk direkam"
                              >
                                {copiedScene === sNum ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#17BF63]" />
                                    <span className="text-[#17BF63]">Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-400" />
                                    <span>Salin Naskah</span>
                                  </>
                                )}
                              </button>

                              {slot && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEpAudio((c) => ({
                                      ...c,
                                      sceneAudios: {
                                        ...c.sceneAudios,
                                        [sNum]: null,
                                      },
                                    }))
                                  }
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 shrink-0 cursor-pointer"
                                  title={`Hapus audio Scene ${sNum}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Mapped Scene Duration Summary */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">
                        Durasi Tersinkronisasi
                      </span>
                      <span className="font-mono-tabular font-bold text-[#17BF63]">
                        Total {sceneDurations.reduce((a, b) => a + b, 0).toFixed(2)} dtk
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {sceneDurations.map((d, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (renderTarget === 'full-episode') {
                              handleSeek(computedTimeline.sceneOffsets[idx]);
                            } else {
                              setRenderTarget((idx + 1) as 1 | 2 | 3 | 4);
                            }
                          }}
                          className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                            activePoint.sceneIndex === idx
                              ? 'border-[#FFD60A] bg-[#FFD60A]/10'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                          }`}
                        >
                          <div className="text-[11px] text-slate-400">
                            Scene {idx + 1}
                          </div>
                          <div className="font-mono-tabular text-xs font-bold text-slate-100 mt-0.5">
                            {d.toFixed(1)}s
                          </div>
                        </button>
                      ))}
                    </div>

                    {rawAudioState.mode === 'per-scene' && (
                      <button
                        type="button"
                        onClick={() => handleExportMp4('full-episode')}
                        disabled={exportState.isExporting}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#FFD60A] hover:bg-[#FACC15] disabled:opacity-60 text-[#0F1B2D] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {exportState.isExporting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Merender Episode ({exportState.progress}%)</span>
                          </>
                        ) : (
                          <>
                            <Film className="w-3.5 h-3.5" />
                            <span>Gabung &amp; Export 1 Episode (.MP4)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}

              {rightTab === 'script' && (
                <div className="space-y-4">
                  {/* Scene Quick Tabs */}
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                    {([1, 2, 3, 4] as const).map((sNum) => (
                      <button
                        key={sNum}
                        type="button"
                        onClick={() => {
                          if (renderTarget === 'full-episode') {
                            handleSeek(computedTimeline.sceneOffsets[sNum - 1] + 0.05);
                          } else {
                            setRenderTarget(sNum);
                          }
                        }}
                        className={`py-1.5 rounded text-xs font-semibold cursor-pointer ${
                          activeScene.sceneNumber === sNum
                            ? 'bg-[#FFD60A] text-[#0F1B2D]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        S{sNum}
                      </button>
                    ))}
                  </div>

                  {/* Background & Characters Detail */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="text-xs font-bold text-[#2D9CFF]">
                      {activeScene.backgroundId} · {activeScene.title}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeScene.backgroundDetail}
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      Tokoh: {activeScene.characters.map((c) => `${c.label} (${c.slot})`).join(' · ')}
                    </div>
                  </div>

                  {/* Proportional Keyframe Timeline ("Alur per detik") */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="text-xs font-bold text-slate-100">
                      Alur per Detik (Tersinkronisasi ke Audio)
                    </div>
                    <div className="space-y-2">
                      {activeScene.timeline.map((beat, i) => {
                        const mappedStart = beat.startSec * activeSceneScale;
                        const mappedEnd = beat.endSec * activeSceneScale;
                        const isCurrent =
                          activePoint.scriptSec >= beat.startSec &&
                          activePoint.scriptSec < beat.endSec;

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const offset =
                                renderTarget === 'full-episode'
                                  ? computedTimeline.sceneOffsets[activePoint.sceneIndex]
                                  : 0;
                              handleSeek(offset + mappedStart + 0.05);
                            }}
                            className={`w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                              isCurrent
                                ? 'border-[#FFD60A] bg-[#FFD60A]/10'
                                : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-mono-tabular font-bold text-[#FFD60A]">
                                {mappedStart.toFixed(1)}–{mappedEnd.toFixed(1)} dtk
                              </span>
                              <span className="text-slate-400 truncate">
                                {beat.triggerWord}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                              {beat.action}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dubbing Narration Text */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">
                        Teks Narasi Dubbing
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyNarration(activeScene.sceneNumber, activeScene.narration)
                        }
                        className="flex items-center gap-1 text-[11px] text-[#2D9CFF] hover:underline cursor-pointer"
                      >
                        {copiedScene === activeScene.sceneNumber ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Teks</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {activeScene.narration}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Intonasi: {activeScene.intonationNote}
                    </p>
                  </div>

                  {/* Pop-up, Spill Fakta & SFX */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Pop-up: </span>
                      <span className="font-semibold text-[#FFD60A]">
                        {activeScene.popupText}
                      </span>
                    </div>
                    {activeScene.spillFakta && (
                      <div>
                        <span className="text-[#17BF63] font-semibold">
                          Spill Fakta (4 dtk):{' '}
                        </span>
                        <span className="text-slate-200">{activeScene.spillFakta}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Musik &amp; SFX: </span>
                      <span className="text-slate-300">
                        {activeScene.musicNote} · {activeScene.sfxNote}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {rightTab === 'mixer' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                      <Sliders className="w-4 h-4 text-[#FFD60A]" />
                      <span>Web Audio Mixer &amp; Auto-Ducking</span>
                    </div>

                    {/* Dubbing Gain */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">Dubbing Narator (Acuan)</span>
                        <span className="font-mono-tabular text-[#FFD60A]">
                          {mixer.dubbingVolumeDb > 0 ? `+${mixer.dubbingVolumeDb}` : mixer.dubbingVolumeDb} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-12}
                        max={6}
                        step={1}
                        value={mixer.dubbingVolumeDb}
                        onChange={(e) =>
                          setMixer((m) => ({
                            ...m,
                            dubbingVolumeDb: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#FFD60A] cursor-pointer"
                      />
                    </div>

                    {/* Lo-Fi BGM */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mixer.bgmEnabled}
                            onChange={(e) =>
                              setMixer((m) => ({ ...m, bgmEnabled: e.target.checked }))
                            }
                            className="accent-[#FFD60A]"
                          />
                          <span>Lo-Fi BGM Synthesizer</span>
                        </label>
                        <span className="font-mono-tabular text-[#2D9CFF]">
                          {mixer.bgmVolumeDb} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-32}
                        max={-6}
                        step={1}
                        disabled={!mixer.bgmEnabled}
                        value={mixer.bgmVolumeDb}
                        onChange={(e) =>
                          setMixer((m) => ({
                            ...m,
                            bgmVolumeDb: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#2D9CFF] cursor-pointer disabled:opacity-40"
                      />
                      <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={mixer.autoDucking}
                          onChange={(e) =>
                            setMixer((m) => ({ ...m, autoDucking: e.target.checked }))
                          }
                          className="accent-[#17BF63]"
                        />
                        <span>Auto-Ducking (-6 dB otomatis saat dubbing bicara)</span>
                      </label>
                    </div>

                    {/* Procedural Foley SFX */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mixer.sfxEnabled}
                            onChange={(e) =>
                              setMixer((m) => ({ ...m, sfxEnabled: e.target.checked }))
                            }
                            className="accent-[#FFD60A]"
                          />
                          <span>Foley SFX Berlapis (Kapur, Biola, Jam, Kamera)</span>
                        </label>
                        <span className="font-mono-tabular text-[#17BF63] whitespace-nowrap shrink-0">
                          {mixer.sfxVolumeDb} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-24}
                        max={0}
                        step={1}
                        disabled={!mixer.sfxEnabled}
                        value={mixer.sfxVolumeDb}
                        onChange={(e) =>
                          setMixer((m) => ({
                            ...m,
                            sfxVolumeDb: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#17BF63] cursor-pointer disabled:opacity-40"
                      />
                      <button
                        type="button"
                        disabled={!mixer.sfxEnabled}
                        onClick={() => {
                          previewSceneSfxOnly(
                            activePoint.scene,
                            mixer.sfxVolumeDb
                          ).catch(() => {});
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-[#FFD60A] border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Tes SFX Scene {activePoint.scene.sceneNumber} Ini
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1.5 leading-relaxed">
                    <div className="font-semibold text-slate-200">
                      Aturan Hening Scene 4
                    </div>
                    <p>
                      Seluruh BGM, SFX, dan sinyal dubbing otomatis berhenti total pada 1 detik terakhir Scene 4 untuk menghasilkan efek freeze-frame cliffhanger “BERSAMBUNG…”.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
