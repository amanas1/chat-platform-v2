import React, { useState } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, placeholder = "Type a message...", disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = text.trim();
    if (!cleanStr || disabled || cleanStr.length > 300) return;
    onSend(cleanStr);
    setText('');
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="p-4 bg-transparent border-t border-white/5 flex items-center gap-3 backdrop-blur-xl relative z-20"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-white/[0.03] text-white placeholder-slate-500 px-5 py-3.5 rounded-2xl 
                   border border-white/10 focus:border-cyan-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]
                   transition-all duration-300 shadow-inner"
        maxLength={300}
        autoComplete="off"
      />
      <button 
        type="submit"
        disabled={!text.trim() || disabled}
        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-purple-600 text-white
                   shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95
                   disabled:opacity-50 disabled:filter-none disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -rotate-45 mb-1 ml-1 group-hover:animate-pulse">
          <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
        </svg>
      </button>
    </form>
  );
};
