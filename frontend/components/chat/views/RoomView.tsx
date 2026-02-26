import React, { useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { TRANSLATIONS } from '../../../types/constants';

interface RoomViewProps {
  roomId: string;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onlineUsers: UserProfile[];
  onSendMessage: (text: string) => void;
  onLeaveRoom: () => void;
  language?: string;
}

export const RoomView: React.FC<RoomViewProps> = ({ roomId, messages, currentUser, onlineUsers, onSendMessage, onLeaveRoom, language = 'en' }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col bg-transparent animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-transparent relative z-10">
        <button 
          onClick={onLeaveRoom}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 flex flex-col">
          <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">{roomId.replace('-', ' ')}</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="relative flex h-1.5 w-1.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
             </span>
             <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">{onlineUsers.length} {t.activeConnections || 'active connections'}</p>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <span className="text-4xl mb-3">🌪️</span>
            <p>{t.welcomeToChaos || 'Welcome to the chaos.'}</p>
            <p className="text-xs mt-1">{t.messagesVanishQuickly || 'Messages vanish quickly.'}</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.senderId === currentUser?.id;
            const senderProfile = onlineUsers.find(u => u.id === msg.senderId);
            return <MessageBubble key={msg.id} message={msg} isOwn={isOwn} senderProfile={senderProfile} />;
          })
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSendMessage} placeholder={t.dropAThought || 'Drop a thought...'} language={language} />
    </div>
  );
};
