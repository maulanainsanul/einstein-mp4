import React, { useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { EpisodeData } from '../types/studio';
import { CANVAS_H, CANVAS_W } from '../engine/chalkAndFx';
import { renderStudioFrame, resolvePlaybackPoint } from '../engine/sceneDirector';

interface StudioCanvasProps {
  episode: EpisodeData;
  currentTimeSec: number;
  totalDurationSec: number;
  sceneDurations: [number, number, number, number];
  target: 'full-episode' | 1 | 2 | 3 | 4;
  isPlaying: boolean;
  isMuted: boolean;
  showSafeZone: boolean;
  audioAmplitude: number;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSeek: (timeSec: number) => void;
  onToggleMute: () => void;
  onToggleSafeZone: () => void;
  onTargetChange: (target: 'full-episode' | 1 | 2 | 3 | 4) => void;
}

function formatTimecode(sec: number): string {
  const s = Math.max(0, sec);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const hundredths = Math.floor((s % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  episode,
  currentTimeSec,
  totalDurationSec,
  sceneDurations,
  target,
  isPlaying,
  isMuted,
  showSafeZone,
  audioAmplitude,
  onTogglePlay,
  onRestart,
  onSeek,
  onToggleMute,
  onToggleSafeZone,
  onTargetChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderStudioFrame(ctx, {
      episode,
      localTimeSec: currentTimeSec,
      sceneDurations,
      target,
      audioAmplitude,
      showSafeZone,
    });
  }, [
    episode,
    currentTimeSec,
    sceneDurations,
    target,
    audioAmplitude,
    showSafeZone,
  ]);

  const resolved = resolvePlaybackPoint(
    episode,
    currentTimeSec,
    sceneDurations,
    target
  );

  // Compute scene marker positions on the scrubber bar when in full-episode mode
  const sceneMarkers: { label: string; pct: number }[] = [];
  if (target === 'full-episode' && totalDurationSec > 0) {
    let acc = 0;
    for (let i = 0; i < 4; i++) {
      sceneMarkers.push({
        label: `S${i + 1}`,
        pct: (acc / totalDurationSec) * 100,
      });
      acc += sceneDurations[i];
    }
  }

  return (
    <div className="flex flex-col items-center justify-between h-full w-full py-3 px-4 select-none">
      {/* Top Stage Info & Target Switcher */}
      <div className="w-full max-w-[520px] flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-xs text-slate-400 truncate">
            Scene {resolved.scene.sceneNumber} · {resolved.scene.backgroundId} ·{' '}
            {resolved.scene.splitScreen ? 'Split-Screen x=540' : resolved.scene.cameraDirection.split('.')[0]}
          </div>
          <div className="text-sm font-semibold text-slate-100 truncate">
            {resolved.scene.title}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleSafeZone}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showSafeZone
              ? 'bg-[#FF3D81]/15 border-[#FF3D81] text-[#FF3D81]'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}
          title="Preview Safe Zone TikTok/Reels (y=150..1670)"
        >
          {showSafeZone ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Safe Zone</span>
        </button>
      </div>

      {/* 9:16 HD 1080x1920 Preview Frame */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center my-1">
        <div
          className="relative h-full max-h-[680px] aspect-[9/16] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0F1B2D]"
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={onTogglePlay}
            className="w-full h-full object-contain cursor-pointer block"
          />
          {resolved.isSilentFreeze && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#FFD60A] text-[#0F1B2D] text-[11px] font-bold tracking-tight">
              FREEZE HENING 1s
            </div>
          )}
        </div>
      </div>

      {/* Transport & Audio-Synced Timeline Scrubber */}
      <div className="w-full max-w-[520px] mt-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
        {/* Render Target Selector (Full Episode vs S1..S4) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['full-episode', 1, 2, 3, 4] as const).map((t) => (
              <button
                key={String(t)}
                type="button"
                onClick={() => onTargetChange(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  target === t
                    ? 'bg-[#FFD60A] text-[#0F1B2D] font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {t === 'full-episode' ? 'Full Episode' : `S${t}`}
              </button>
            ))}
          </div>

          <div className="font-mono-tabular text-xs text-slate-300">
            <span className="text-[#FFD60A] font-semibold">
              {formatTimecode(currentTimeSec)}
            </span>
            <span className="text-slate-500"> / </span>
            <span>{formatTimecode(totalDurationSec)}</span>
          </div>
        </div>

        {/* Scrubber Bar with Scene Boundaries */}
        <div className="relative pt-1">
          <input
            type="range"
            min={0}
            max={Math.max(0.1, totalDurationSec)}
            step={0.01}
            value={Math.min(currentTimeSec, totalDurationSec)}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full accent-[#FFD60A] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            aria-label="Scrub timeline"
          />
          {sceneMarkers.length > 0 && (
            <div className="relative h-4 mt-0.5">
              {sceneMarkers.map((m) => (
                <span
                  key={m.label}
                  style={{ left: `${m.pct}%` }}
                  className="absolute top-0 text-[10px] font-mono-tabular text-slate-500 -translate-x-0.5"
                >
                  {m.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Play / Restart / Mute Controls */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFD60A] hover:bg-[#FACC15] text-[#0F1B2D] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Putar Preview</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Ulangi dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>1080×1920 · 30fps 2.5D Living Rig</span>
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
