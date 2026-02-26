import React, { useEffect, useRef } from 'react';
import { ChatMessage, SessionData, UserProfile } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { playRoomJoinSound, playPanelCloseSound } from '../utils/spatialSoundEngine';

interface PrivateChatViewProps {
  session: SessionData;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onSendMessage: (text: string) => void;
  onLeaveSession: () => void;
  language?: string;
}

export const PrivateChatView: React.FC<PrivateChatViewProps> = ({ session, messages, currentUser, onSendMessage, onLeaveSession, language = 'en' }) => {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playRoomJoinSound();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col bg-transparent animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 py-4 border-b border-white/5 bg-transparent shadow-sm relative z-10 glass-panel border-l-0 border-r-0 border-t-0 rounded-none">
        <button 
          onClick={() => { playPanelCloseSound(); onLeaveSession(); }}
          className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300 cursor-pointer border border-transparent hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0A0E1A] border-2 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
               <img src={session.partnerProfile?.avatar} alt="Partner" className="w-full h-full object-cover" />
             </div>
             <div className="absolute bottom-0 right-[0px] w-3 h-3 bg-green-500 rounded-full border border-[#0A0E1A] shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-white tracking-wide">{session.partnerProfile?.name || 'Аноним'}</h2>
            <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest mt-0.5">Зашифровано • Самоуничтожается</p>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500/60 italic">
            <span className="text-4xl mb-4 opacity-70">🔒</span>
            <p className="text-xs font-medium tracking-wide">Приватная сессия.</p>
            <p className="text-xs mt-1">Сообщения удаляются через 30с.</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isOwn={msg.senderId === currentUser?.id} 
              senderProfile={msg.senderId === currentUser?.id ? currentUser! : session.partnerProfile} 
            />
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSendMessage} placeholder="Введите сообщение..." language={language} />
    </div>
  );
};
