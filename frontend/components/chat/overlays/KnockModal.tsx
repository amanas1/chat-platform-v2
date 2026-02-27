import React, { useEffect, useState } from 'react';
import { KnockState, UserProfile } from '../types';
import { playCardOpenSound } from '../utils/spatialSoundEngine';

interface KnockModalProps {
  knock: KnockState;
  fromUser?: UserProfile; 
  onAccept: () => void;
  onReject: () => void;
  language?: string;
}

export const KnockModal: React.FC<KnockModalProps> = ({ knock, fromUser, onAccept, onReject, language = 'en' }) => {
  const [timer, setTimer] = useState(15);
  
  // Auto-reject countdown
  useEffect(() => {
    playCardOpenSound();
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { onReject(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onReject]);

  if (!fromUser) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-3 animate-[fadeIn_0.2s_ease-out]">
      <div className="radio-card p-4 bg-[#151b2b] border-amber-900/30">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1a1f2e] border border-white/8 shrink-0">
            {fromUser.avatar ? (
              <img src={fromUser.avatar} alt={fromUser.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg text-slate-500">👤</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#e5e7eb] truncate">{fromUser.name || 'Аноним'}</p>
            <p className="text-[10px] text-amber-500/80 font-medium">Хочет начать разговор • {timer}с</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="radio-btn-ghost flex-1 py-2.5 text-[11px] uppercase tracking-wider"
          >
            Отклонить
          </button>
          <button
            onClick={onAccept}
            className="radio-btn-primary flex-1 py-2.5 text-[11px] uppercase tracking-wider"
          >
            Принять
          </button>
        </div>

        {/* Timer bar */}
        <div className="mt-3 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-600/50 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timer / 15) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
