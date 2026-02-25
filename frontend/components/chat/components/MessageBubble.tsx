import React, { useEffect, useState } from 'react';
import { ChatMessage, UserProfile } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  senderProfile?: UserProfile;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, senderProfile }) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, message.expiresAt - Date.now()));

  // Purely visual countdown for the precise TTL remaining
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

  const progress = Math.min(100, Math.max(0, (timeLeft / 30000) * 100)); // Default assumed max 30s
  const isUrgent = timeLeft < 5000;

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-[fadeIn_0.3s_ease-out]`}>
      
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 mr-2 flex-shrink-0 mt-auto border border-slate-700">
           {senderProfile?.avatar ? (
             <img src={senderProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-slate-700" />
           )}
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] relative ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Name wrapper */}
        {!isOwn && senderProfile?.name && (
          <span className="text-[10px] text-slate-400 font-medium ml-1 mb-1">
            {senderProfile.name}
          </span>
        )}

        {/* Bubble */}
        <div 
          className={`relative px-4 py-2.5 rounded-2xl text-sm md:text-base leading-relaxed break-words
            ${isOwn 
              ? 'bg-purple-600/90 text-white rounded-br-sm shadow-[0_4px_15px_rgba(147,51,234,0.3)]' 
              : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700 shadow-md'
            }
          `}
        >
          {message.text}

          {/* Sparkle or TTL visual indicator */}
          <div 
            className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-100
              ${isUrgent ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : isOwn ? 'bg-white/40' : 'bg-purple-500/50'}
            `}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
