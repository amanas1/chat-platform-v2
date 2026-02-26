import React from 'react';

import { TRANSLATIONS } from '../../../types/constants';

interface RoomSelectorViewProps {
  onSelectRoom: (roomId: string) => void;
  onGoToDiscovery: () => void;
  language?: string;
}

import { playCardOpenSound } from '../utils/spatialSoundEngine';

const ROOMS = [
  { id: 'global-chill', name: 'Global Chill', icon: '🎧', description: 'Неформальное общение и лёгкая атмосфера.' },
  { id: 'tech-talk', name: 'Tech Talk', icon: '💻', description: 'Технологии, стартапы и искусственный интеллект.' },
  { id: 'music-lovers', name: 'Music Lovers', icon: '🎵', description: 'Музыка и обсуждение любимых треков.' },
  { id: 'random-chaos', name: 'Random Flow', icon: '🌊', description: 'Свободный поток общения.' }
];

export const RoomSelectorView: React.FC<RoomSelectorViewProps> = ({ onSelectRoom, onGoToDiscovery, language = 'en' }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  return (
    <div className="w-full h-full flex flex-col p-6 bg-transparent overflow-y-auto no-scrollbar relative z-10 pb-20">
      <div className="flex flex-col mb-8 gap-2">
        <h1 className="text-2xl font-black text-white tracking-tight">Публичные комнаты</h1>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">Общение по интересам в открытом формате.</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {ROOMS.map((room, i) => (
          <button
            key={room.id}
            onClick={() => { playCardOpenSound(); onSelectRoom(room.id); }}
            style={{ animationDelay: `${i * 100}ms` }}
            className="group relative flex items-center gap-5 p-5 rounded-2xl glass-panel hover-lift text-left animate-[fadeIn_0.5s_ease-out_both] overflow-hidden"
          >
            {/* Soft Ambient Glow Underlay */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-transparent blur-2xl group-hover:from-cyan-500/20 transition-all pointer-events-none" />
            
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-[1.15] group-hover:-rotate-3 transition-all duration-300 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
               <span className="text-2xl drop-shadow-md">{room.icon}</span>
            </div>
            <div className="flex-1 min-w-0 z-10">
                <h3 className="text-[15px] font-black text-white mb-1 tracking-wide group-hover:text-cyan-300 transition-colors uppercase">{room.name}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed truncate">{room.description}</p>
            </div>

            {/* Subtle Right Arrow Indication */}
            <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 mr-2 text-cyan-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
