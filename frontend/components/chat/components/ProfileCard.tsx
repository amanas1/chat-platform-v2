import React from 'react';
import { UserProfile } from '../types';

interface ProfileCardProps {
  user: UserProfile;
  onClick?: () => void;
  isOnline?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClick, isOnline = true }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative p-3 rounded-2xl cursor-pointer transition-all duration-300
        bg-slate-800/60 backdrop-blur-md border border-white/5 
        hover:bg-slate-700/80 hover:scale-[1.02] hover:shadow-xl hover:border-white/20
        flex flex-col items-center gap-3 w-full
      `}
    >
      <div className="relative">
        {/* Avatar Container */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-700">
          <img 
            src={user.avatar || '/preset-avatars/default.png'} // Assumes avatars are predefined
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Glowing Online Indicator */}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800 
            shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" 
          />
        )}
      </div>

      <div className="text-center w-full">
        <h3 className="text-sm font-bold text-white truncate px-2">
          {user.name || 'Anonymous'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
          <span>{user.country}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <span>{user.age || '?'}y</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-1 justify-center max-h-12 overflow-hidden">
           {user.interests?.slice(0, 3).map((interest, i) => (
             <span key={i} className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] text-white/80">
               {interest}
             </span>
           ))}
        </div>
      </div>
    </div>
  );
};
