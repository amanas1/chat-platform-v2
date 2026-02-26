import React, { useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { playRoomJoinSound, playPanelCloseSound } from '../utils/spatialSoundEngine';

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
      <div className="flex items-center gap-4 p-5 py-4 border-b border-white/5 bg-transparent relative z-10 shadow-sm">
        <button 
          onClick={() => { playPanelCloseSound(); onLeaveRoom(); }}
          className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300 cursor-pointer border border-transparent hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 flex flex-col">
          <h2 className="text-[13px] font-black text-white uppercase tracking-widest">{roomId.replace('-', ' ')}</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.8)]"></span>
             </span>
             <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Сейчас в комнате: {onlineUsers.length} пользователя</p>
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
            <span className="text-4xl mb-4 opacity-70">🎧</span>
            <p className="text-xs font-medium tracking-wide">Системное сообщение:</p>
            <p className="text-xs mt-1">Добро пожаловать в комнату. Сообщения не сохраняются.</p>
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
      <ChatInput onSend={onSendMessage} placeholder="Введите сообщение..." language={language} />
    </div>
  );
};
