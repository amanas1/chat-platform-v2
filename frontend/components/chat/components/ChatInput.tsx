import React, { useState } from 'react';
import { playMessageSentSound } from '../utils/spatialSoundEngine';

interface ChatInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  language?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, placeholder = "Type a message...", disabled, language }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = text.trim();
    if (!cleanStr || disabled || cleanStr.length > 300) return;
    playMessageSentSound();
    onSend(cleanStr);
    setText('');
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2 shrink-0"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 radio-input px-4 py-3 text-[13px] placeholder-slate-600"
        maxLength={300}
        autoComplete="off"
      />
      <button 
        type="submit"
        disabled={!text.trim() || disabled}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-900/40 text-amber-400/80
                   hover:bg-amber-800/50 hover:text-amber-300 active:scale-95
                   disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -rotate-45 mb-0.5 ml-0.5">
          <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
        </svg>
      </button>
    </form>
  );
};
