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
      className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-slate-800/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl 
                   border border-slate-700 focus:border-purple-500 focus:outline-none focus:bg-slate-800
                   transition-all duration-200 shadow-inner"
        maxLength={300}
        autoComplete="off"
      />
      <button 
        type="submit"
        disabled={!text.trim() || disabled}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-600 text-white
                   hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -rotate-45 mb-1 ml-1">
          <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
        </svg>
      </button>
    </form>
  );
};
