import React, { useEffect, useRef, useState } from 'react';
import { CHARACTER_CATALOG, MASTER_BACKGROUNDS } from '../data/episodes';
import { renderMasterBackground } from '../engine/backgrounds';
import { CANVAS_H, CANVAS_W, drawChalkboardBase } from '../engine/chalkAndFx';
import { drawCharacter25D } from '../engine/characters';
import { BackgroundId, CharacterId } from '../types/studio';

const CharacterPreviewCard: React.FC<{
  id: CharacterId;
  name: string;
  ageOrRole: string;
  episodes: string;
  visualTraits: string;
  propsAndActing: string;
  expression: 'neutral' | 'happy' | 'curious' | 'smug' | 'tongue';
}> = ({ id, name, ageOrRole, episodes, visualTraits, propsAndActing, expression }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    const container = cardRef.current;
    if (!c || !container) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let isVisible = true;
    const startTime = performance.now();

    const drawAt = (t: number) => {
      const s = 0.65;
      ctx.save();
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.scale(s, s);
      drawChalkboardBase(ctx, t, { showGrid: true });
      drawCharacter25D(
        ctx,
        {
          id,
          label: name,
          slot: 'center',
          facing: 'front',
          expression,
          scale: id.includes('baby') || id === 'maja' ? 1.25 : 1,
        },
        c.width / (2 * s),
        595,
        t,
        false
      );
      ctx.restore();
    };

    drawAt(1.5);

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    let lastRender = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (!isVisible) return;
      if (now - lastRender < 33) return; // 30fps live gallery motion
      lastRender = now;
      const t = 1.5 + (now - startTime) / 1000;
      drawAt(t);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [id, name, expression]);

  return (
    <div ref={cardRef} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="relative bg-[#0F1B2D] aspect-[9/11] flex items-center justify-center border-b border-slate-800">
        <canvas
          ref={canvasRef}
          width={324}
          height={420}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-4 space-y-1.5 flex-1">
        <div className="text-xs text-slate-400">
          {ageOrRole} · {episodes}
        </div>
        <h3 className="text-sm font-bold text-slate-100">{name}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{visualTraits}</p>
        <p className="text-xs text-[#FFD60A]/90 pt-1">{propsAndActing}</p>
      </div>
    </div>
  );
};

const BackgroundPreviewCard: React.FC<{
  id: BackgroundId;
  name: string;
  episodes: string;
  elements: string;
  lightingAndMotion: string;
}> = ({ id, name, episodes, elements, lightingAndMotion }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const variantMap: Record<BackgroundId, string> = {
      'L-01': 'kamar-bersalin',
      'L-02': 'kelas-munich',
      'L-03': 'pegunungan-italia',
      'L-04': 'gerbang-eth',
      'L-05': 'apartemen-olympia',
      'L-06': 'papan-satu-persamaan',
      'L-07': 'langit-gerhana',
      'L-08': 'royal-society',
      'L-09': 'dek-kapal',
      'L-10': 'pelabuhan-1933',
      'L-11': 'princeton-musim-gugur',
      'L-12': 'observatorium-gelombang',
    };

    ctx.save();
    ctx.scale(0.28, 0.28);
    renderMasterBackground(ctx, {
      bgId: id,
      variant: variantMap[id],
      timeSec: 3.2,
      sceneProgress: 0.65,
    });
    ctx.restore();
  }, [id]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="bg-[#0F1B2D] aspect-[9/14] border-b border-slate-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={Math.round(CANVAS_W * 0.28)}
          height={Math.round(CANVAS_H * 0.28)}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-1.5 flex-1">
        <div className="text-xs font-mono-tabular text-[#2D9CFF]">
          {id} · {episodes}
        </div>
        <h3 className="text-sm font-bold text-slate-100">{name}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{elements}</p>
        <p className="text-xs text-slate-300 pt-1">{lightingAndMotion}</p>
      </div>
    </div>
  );
};

export const CharacterGallery: React.FC = () => {
  const [tab, setTab] = useState<'characters' | 'backgrounds'>('characters');
  const [expression, setExpression] = useState<
    'neutral' | 'happy' | 'curious' | 'smug' | 'tongue'
  >('happy');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            Pustaka Karakter 2.5D &amp; 12 Latar Induk
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Dirender langsung dengan Bezier Curves berlapis, outline stiker 6px, cel-shading, dan rim-light.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tab === 'characters' && (
            <select
              value={expression}
              onChange={(e) =>
                setExpression(
                  e.target.value as 'neutral' | 'happy' | 'curious' | 'smug' | 'tongue'
                )
              }
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer"
            >
              <option value="happy">Ekspresi: Senang</option>
              <option value="curious">Ekspresi: Penasaran</option>
              <option value="smug">Ekspresi: Nyengir / Santai</option>
              <option value="neutral">Ekspresi: Netral</option>
              <option value="tongue">Ekspresi: Julur Lidah</option>
            </select>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setTab('characters')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'characters'
                  ? 'bg-[#FFD60A] text-[#0F1B2D]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Karakter ({CHARACTER_CATALOG.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('backgrounds')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'backgrounds'
                  ? 'bg-[#FFD60A] text-[#0F1B2D]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              12 Latar Induk
            </button>
          </div>
        </div>
      </div>

      {tab === 'characters' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CHARACTER_CATALOG.map((c) => (
            <CharacterPreviewCard key={c.id} {...c} expression={expression} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MASTER_BACKGROUNDS.map((bg) => (
            <BackgroundPreviewCard key={bg.id} {...bg} />
          ))}
        </div>
      )}
    </div>
  );
};
