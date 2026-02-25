import React, { useEffect } from 'react';
import { KnockState, UserProfile } from '../types';
import { ProfileCard } from '../components/ProfileCard';

interface KnockModalProps {
  knock: KnockState;
  fromUser?: UserProfile; 
  onAccept: () => void;
  onReject: () => void;
}

export const KnockModal: React.FC<KnockModalProps> = ({ knock, fromUser, onAccept, onReject }) => {
  
  // Auto-reject if ignored for 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onReject();
    }, 15000);
    return () => clearTimeout(timer);
  }, [onReject]);

  if (!fromUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backend */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={onReject}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-purple-500/30 w-full max-w-sm rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-[slideUpScale_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-purple-600/20 blur-2xl rounded-full pointer-events-none" />

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Incoming Knock</h2>
          <p className="text-sm text-slate-400">Someone wants to chat privately</p>
        </div>

        <div className="mb-8">
           <ProfileCard user={fromUser} isOnline={true} onClick={() => {}} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            Ignore
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            Accept
          </button>
        </div>

        {/* Countdown Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-purple-500/50 rounded-b-3xl w-full overflow-hidden">
           <div className="h-full bg-purple-500 w-full animate-[shrinkLinear_15s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
};
