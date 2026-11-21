import React, { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { EpisodeData } from '../types/studio';

interface JsonEditorPanelProps {
  episode: EpisodeData;
  onSaveEpisode: (updated: EpisodeData) => void;
  onResetEpisode: (episodeId: number) => void;
}

export const JsonEditorPanel: React.FC<JsonEditorPanelProps> = ({
  episode,
  onSaveEpisode,
  onResetEpisode,
}) => {
  const [text, setText] = useState(() => JSON.stringify(episode, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(episode, null, 2));
    setError(null);
  }, [episode]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(text) as EpisodeData;
      if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length !== 4) {
        setError('Struktur JSON harus memiliki tepat 4 scene pada properti "scenes".');
        return;
      }
      setError(null);
      onSaveEpisode(parsed);
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Format JSON tidak valid.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            JSON Inspector &amp; Editor — Episode {episode.id}: {episode.title}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Ubah teks narasi, waktu keyframe alur per detik, kata pemicu, pop-up, Spill Fakta, posisi tokoh, atau latar secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onResetEpisode(episode.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FFD60A] hover:bg-[#FACC15] text-[#0F1B2D] text-xs font-bold transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{savedFlag ? 'Tersimpan!' : 'Terapkan Perubahan'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-700 text-xs text-rose-200 font-mono-tabular">
          {error}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="w-full h-[640px] bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono-tabular text-xs leading-relaxed text-slate-200 focus:outline-none focus:border-[#FFD60A]"
      />
    </div>
  );
};
