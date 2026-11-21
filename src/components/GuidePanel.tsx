import React from 'react';
import { ALL_EPISODES, CLIFFHANGER_CHAIN } from '../data/episodes';

export const GuidePanel: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100">
          Panduan Eksekusi Produksi &amp; Rantai Cliffhanger
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Spesifikasi standar 1080×1920, aturan Scene 4, pengaturan suara narator ElevenLabs, dan daftar lengkap 14 Episode.
        </p>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-[#FFD60A]">
            Kanvas, Pill &amp; Subtitle Karaoke (9:16)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Resolusi 1080×1920 px · Zona aksi y=150–1670 (sisakan 150px atas &amp; 250px bawah). Pill Header di x=60, y=150 · Subtitle Karaoke kata-demi-kata di y=1560 (highlight #FFD60A) · Gaya 2.5D Clay Volumetrik berpartikel kapur.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-[#2D9CFF]">
            Aturan Wajib Scene 4 (Cliffhanger)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            0–7 dtk narasi awal · 7–11 dtk kartu “Cek Fakta ✔” di y=1320–1480 · 11–14 dtk zoom-in benda kunci (Speed 0.85) · 14–15 dtk fade to black, hening 1 dtk, stempel kotak merah miring “BERSAMBUNG…” di y=960.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-[#17BF63]">
            Mixer Audio &amp; Auto-Ducking
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dubbing narator 0 dB sebagai acuan durasi · Lo-Fi BGM -18 dB (otomatis turun -6 dB saat narator bicara) · Procedural SFX -10 dB · Seluruh lapisan audio berhenti total pada 1 detik hening akhir Scene 4.
          </p>
        </div>
      </div>

      {/* ElevenLabs & Cliffhanger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-100">
            Rantai Cliffhanger 14 Episode
          </h3>
          <div className="divide-y divide-slate-800">
            {CLIFFHANGER_CHAIN.map((item, idx) => (
              <div
                key={item}
                className="py-2 flex items-center gap-3 text-xs text-slate-300"
              >
                <span className="font-mono-tabular text-[#FFD60A] w-6">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-100">
            Daftar Lengkap Mitos yang Diluruskan
          </h3>
          <div className="divide-y divide-slate-800">
            {ALL_EPISODES.map((ep) => (
              <div key={ep.id} className="py-2 text-xs">
                <div className="font-semibold text-slate-100">
                  Ep {ep.id} · {ep.title}
                </div>
                <div className="text-slate-400 mt-0.5">
                  Mitos: {ep.mythBusted}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
