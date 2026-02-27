import React from 'react';
import { UserProfile } from '../types';
import { playCardOpenSound } from '../utils/spatialSoundEngine';

interface ConveyorCardProps {
  user: UserProfile;
  onKnock: (userId: string) => void;
  isWaiting?: boolean;
  isBusy?: boolean;
  waitingTimer?: number;
}

export const ConveyorCard: React.FC<ConveyorCardProps> = ({ user, onKnock, isWaiting, isBusy, waitingTimer }) => {
  const statusLabel = isBusy ? 'В разговоре' : 'Онлайн';
  const statusColor = isBusy ? 'text-amber-500/60' : 'text-emerald-400';
  const statusDot = isBusy ? 'bg-amber-500/50' : 'bg-emerald-400';

  return (
    <div 
      className={`radio-card p-4 flex items-center gap-4 animate-[fadeIn_0.3s_ease-out] ${isBusy ? 'opacity-50' : ''}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-[#1a1f2e] border border-white/8">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl text-slate-500">
              {user.gender === 'female' ? '👩' : '👤'}
            </div>
          )}
        </div>
        {/* Online dot */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusDot} rounded-full border-2 border-[#121826]`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-[#e5e7eb] truncate">{user.name || 'Аноним'}</span>
          <span className="text-[11px] text-slate-500">•</span>
          <span className="text-[11px] text-slate-500">{user.age}</span>
          <span className="text-[11px] text-slate-500">•</span>
          <span className="text-[11px] text-slate-500 truncate">{user.country}</span>
        </div>
        <span className={`text-[10px] font-medium ${statusColor} uppercase tracking-wider`}>{statusLabel}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Voice play button (only if voiceIntro exists) */}
        {user.voiceIntro && (
          <button className="w-9 h-9 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-[#e5e7eb] hover:bg-white/8 transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        )}

        {/* Knock button */}
        <button
          disabled={isBusy || isWaiting}
          onClick={() => { playCardOpenSound(); onKnock(user.id); }}
          className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all
            ${isWaiting 
              ? 'bg-amber-900/30 text-amber-400 border border-amber-700/40 cursor-wait' 
              : isBusy 
                ? 'bg-white/3 text-slate-600 border border-white/5 cursor-not-allowed'
                : 'radio-btn-primary cursor-pointer'
            }`}
        >
          {isWaiting ? `Ждём... (${waitingTimer || '…'})` : isBusy ? 'Занят' : 'Knock'}
        </button>
      </div>
    </div>
  );
};
