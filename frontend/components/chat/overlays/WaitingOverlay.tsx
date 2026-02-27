import React, { useEffect, useState } from 'react';

interface WaitingOverlayProps {
  onCancel: () => void;
  targetName?: string;
  language?: string;
}

export const WaitingOverlay: React.FC<WaitingOverlayProps> = ({ onCancel, targetName = 'User', language = 'en' }) => {
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { onCancel(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onCancel]);

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-3 animate-[fadeIn_0.2s_ease-out]">
      <div className="radio-card p-4 bg-[#151b2b] border-amber-900/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#e5e7eb] font-medium truncate">Ожидание {targetName}...</p>
            <p className="text-[10px] text-slate-500">{timer}с осталось</p>
          </div>
          <button
            onClick={onCancel}
            className="radio-btn-ghost px-3 py-2 text-[10px] uppercase tracking-wider"
          >
            Отмена
          </button>
        </div>

        {/* Timer bar */}
        <div className="mt-3 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-600/40 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timer / 15) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
