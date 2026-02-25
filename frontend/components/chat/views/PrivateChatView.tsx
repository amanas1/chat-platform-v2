import React, { useEffect, useRef } from 'react';
import { ChatMessage, SessionData, UserProfile } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';

interface PrivateChatViewProps {
  session: SessionData;
  messages: ChatMessage[];
  currentUser: UserProfile | null;
  onSendMessage: (text: string) => void;
  onLeaveSession: () => void;
}

export const PrivateChatView: React.FC<PrivateChatViewProps> = ({ session, messages, currentUser, onSendMessage, onLeaveSession }) => {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/90 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-purple-500/20 bg-slate-900 shadow-md">
        <button 
          onClick={onLeaveSession}
          className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-1 flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border-2 border-purple-500">
               <img src={session.partnerProfile?.avatar} alt="Partner" className="w-full h-full object-cover" />
             </div>
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-slate-900 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{session.partnerProfile?.name || 'Anonymous'}</h2>
            <p className="text-[10px] text-green-400 font-medium">Encrypted • Self-Destructing</p>
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
            <span className="text-4xl mb-3 text-purple-400/50">🔒</span>
            <p>Private end-to-end session.</p>
            <p className="text-[10px] mt-1 text-slate-600">Messages vanish after 30s.</p>
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
      <ChatInput onSend={onSendMessage} placeholder="Type securely..." />
    </div>
  );
};
