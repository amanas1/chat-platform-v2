import React from 'react';

interface RoomSelectorViewProps {
  onSelectRoom: (roomId: string) => void;
  onGoToDiscovery: () => void;
}

const ROOMS = [
  { id: 'global-chill', name: 'Global Chill', icon: '🎧', description: 'Relaxed vibes and casual global chat.' },
  { id: 'tech-talk', name: 'Tech Talk', icon: '💻', description: 'Discussing programming, AI, and startups.' },
  { id: 'music-lovers', name: 'Music Lovers', icon: '🎵', description: 'Share what you are listening to.' },
  { id: 'random-chaos', name: 'Random Chaos', icon: '🌪️', description: 'Anything goes. Pure ephemeral flow.' }
];

export const RoomSelectorView: React.FC<RoomSelectorViewProps> = ({ onSelectRoom, onGoToDiscovery }) => {
  return (
    <div className="w-full h-full flex flex-col p-4 bg-slate-950/80 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white tracking-tight">Interest Rooms</h1>
        <button 
          onClick={onGoToDiscovery}
          className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-full transition-colors"
        >
          Find Users
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROOMS.map(room => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className="group relative flex flex-col items-start p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent blur-2xl group-hover:from-purple-500/20 transition-all" />
            
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{room.icon}</span>
            <h3 className="text-xl font-bold text-white mb-2">{room.name}</h3>
            <p className="text-left text-sm text-slate-400">{room.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
