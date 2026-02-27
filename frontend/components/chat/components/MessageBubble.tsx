import React, { useEffect, useState } from 'react';
import { ChatMessage, UserProfile } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  senderProfile?: UserProfile;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, senderProfile }) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, message.expiresAt - Date.now()));

  useEffect(() => {
    let frame: number;
    const tick = () => {
      const remaining = Math.max(0, message.expiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining > 0) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [message.expiresAt]);

  const progress = Math.min(100, Math.max(0, (timeLeft / 30000) * 100));
  const isUrgent = timeLeft < 5000;
  const isFading = timeLeft < 3000;

  return (
    <div 
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-3 animate-[fadeIn_0.2s_ease-out] transition-opacity duration-300 ${isFading ? 'opacity-30 blur-[1px]' : ''}`}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full overflow-hidden bg-[#1a1f2e] mr-2 flex-shrink-0 mt-auto border border-white/6">
           {senderProfile?.avatar ? (
             <img src={senderProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-[#1a1f2e]" />
           )}
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] relative ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && senderProfile?.name && (
          <span className="text-[10px] text-slate-600 font-medium ml-1 mb-1">{senderProfile.name}</span>
        )}

        <div 
          className={`relative px-4 py-2.5 text-[13px] leading-relaxed break-words transition-all duration-200
            ${isOwn 
              ? 'bg-[#1a1520] text-[#e5e7eb] rounded-2xl rounded-br-sm border border-amber-900/20' 
              : 'bg-[#111827] text-[#d1d5db] rounded-2xl rounded-bl-sm border border-white/6'
            }
          `}
        >
          {message.text}

          {/* Life bar */}
          <div 
            className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-all duration-100
              ${isUrgent ? 'bg-red-500/70' : isOwn ? 'bg-amber-700/40' : 'bg-slate-600/40'}
            `}
            style={{ width: `${progress * 0.9}%` }}
          />
        </div>
      </div>
    </div>
  );
};
