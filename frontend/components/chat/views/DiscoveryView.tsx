import React from 'react';
import { UserProfile } from '../types';
import { ProfileCard } from '../components/ProfileCard';

interface DiscoveryViewProps {
  users: UserProfile[];
  onKnockUser: (userId: string) => void;
  onGoToRooms: () => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ users, onKnockUser, onGoToRooms }) => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950/80 overflow-y-auto animate-[fadeIn_0.3s_ease-out]">
      
      {/* Discovery Header */}
      <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Global Discovery <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
          </h1>
          <button 
            onClick={onGoToRooms}
            className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 text-pink-300 rounded-full transition-colors"
          >
            Public Rooms
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Showing a fair-distribution snapshot of currently active users across the globe. Click to knock.
        </p>
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {users.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500">
            <p>Scanning the globe...</p>
          </div>
        ) : (
          users.map(user => (
             <ProfileCard 
               key={user.id} 
               user={user} 
               isOnline={true} 
               onClick={() => onKnockUser(user.id)} 
             />
          ))
        )}
      </div>

    </div>
  );
};
