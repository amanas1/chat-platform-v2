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

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col bg-transparent animate-[fadeIn_0.2s_ease-out]">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] shrink-0">
        {/* Back */}
        <button 
          onClick={() => { playPanelCloseSound(); onLeaveSession(); }}
          className="p-2 -ml-1 rounded-lg text-slate-500 hover:text-[#e5e7eb] hover:bg-white/5 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Partner info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1a1f2e] border border-white/8">
              {session.partnerProfile?.avatar ? (
                <img src={session.partnerProfile.avatar} alt="Partner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg text-slate-500">👤</div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111827]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-[#e5e7eb] truncate">{session.partnerProfile?.name || 'Аноним'}</h2>
            <p className="text-[9px] text-emerald-500/80 font-medium uppercase tracking-widest">В разговоре</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Report */}
          <button className="p-2 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-white/5 transition-all" title="Пожаловаться">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </button>
          {/* Block */}
          <button className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/5 transition-all" title="Заблокировать">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
          {/* Exit */}
          <button 
            onClick={() => { playPanelCloseSound(); onLeaveSession(); }}
            className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/5 transition-all" 
            title="Выйти"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth no-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <span className="text-2xl opacity-30 mb-3">🔒</span>
            <p className="text-[11px] text-slate-600 italic">Приватная сессия начата</p>
            <p className="text-[10px] text-slate-700 mt-1 italic">Сообщения удаляются через 30 сек</p>
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
      <ChatInput onSend={onSendMessage} placeholder="Напишите сообщение..." language={language} />
    </div>
  );
};
