import React, { useEffect, useState } from 'react';

interface WaitingOverlayProps {
  onCancel: () => void;
  targetName?: string;
}

export const WaitingOverlay: React.FC<WaitingOverlayProps> = ({ onCancel, targetName = 'User' }) => {
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Pulsing rings */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-2 rounded-full border border-pink-500/40 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-600/20 to-pink-600/20 shadow-[0_0_40px_rgba(168,85,247,0.4)]" />
          
          <svg className="w-10 h-10 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          Waiting for {targetName}{dots}
        </h2>
        <p className="text-slate-400 text-sm mb-8 text-center max-w-[250px]">
          They are reviewing your knock. If they don't respond in 15s, it will automatically cancel.
        </p>

        <button
          onClick={onCancel}
          className="px-8 py-3 rounded-full font-bold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200"
        >
          Cancel Knock
        </button>
      </div>
    </div>
  );
};
