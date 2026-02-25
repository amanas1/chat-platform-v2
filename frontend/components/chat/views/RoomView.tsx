import React, { useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';

interface RoomViewProps {
  roomId: string;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onlineUsers: UserProfile[];
  onSendMessage: (text: string) => void;
  onLeaveRoom: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({ roomId, messages, currentUser, onlineUsers, onSendMessage, onLeaveRoom }) => {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/80 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <button 
          onClick={onLeaveRoom}
          className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white capitalize">{roomId.replace('-', ' ')}</h2>
          <p className="text-xs text-purple-400 font-medium tracking-wide">Public Live Flow</p>
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
            <p>Welcome to the chaos.</p>
            <p className="text-xs mt-1">Messages vanish quickly.</p>
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
      <ChatInput onSend={onSendMessage} placeholder="Drop a thought..." />
    </div>
  );
};
