import React from 'react';

import { TRANSLATIONS } from '../../../types/constants';

interface RoomSelectorViewProps {
  onSelectRoom: (roomId: string) => void;
  onGoToDiscovery: () => void;
  language?: string;
}

const ROOMS = [
  { id: 'global-chill', name: 'Global Chill', icon: '🎧', description: 'Relaxed vibes and casual global chat.' },
  { id: 'tech-talk', name: 'Tech Talk', icon: '💻', description: 'Discussing programming, AI, and startups.' },
  { id: 'music-lovers', name: 'Music Lovers', icon: '🎵', description: 'Share what you are listening to.' },
  { id: 'random-chaos', name: 'Random Chaos', icon: '🌪️', description: 'Anything goes. Pure ephemeral flow.' }
];

export const RoomSelectorView: React.FC<RoomSelectorViewProps> = ({ onSelectRoom, onGoToDiscovery, language = 'en' }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  return (
    <div className="w-full h-full flex flex-col p-6 bg-transparent overflow-y-auto no-scrollbar relative z-10">
      <div className="flex flex-col mb-6 gap-2">
        <h1 className="text-xl font-black text-white tracking-[0.2em] uppercase">{t.nodes || 'Nodes'}</h1>
        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">{t.selectPublicFrequency || 'Select a public frequency'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ROOMS.map((room, i) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            style={{ animationDelay: `${i * 100}ms` }}
            className="group relative flex items-center gap-5 p-5 rounded-[18px] bg-white/[0.02] border border-white/[0.06] hover:border-cyan-400/50 hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 overflow-hidden animate-[fadeIn_0.5s_ease-out_both] text-left"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent blur-2xl group-hover:from-cyan-500/20 transition-all pointer-events-none" />
            
            <span className="text-3xl drop-shadow-md group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 shrink-0">{room.icon}</span>
            <div className="flex-1 min-w-0 z-10">
                <h3 className="text-sm font-black text-white/90 mb-1 group-hover:text-cyan-300 transition-colors uppercase tracking-widest">{room.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{room.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
