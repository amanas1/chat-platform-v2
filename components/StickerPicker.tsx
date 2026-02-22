import React from 'react';

const STICKER_CODES = [
  "1f525", "2764_fe0f", "1f602", "1f60d", "1f60e", "1f914", "1f97a", "1f973", "1f92f", "1f921", 
  "1f47b", "1f47d", "1f480", "1f440", "1f44d", "1f44e", "1f44f", "1f389", "2728", "1f4a9"
];

export const STICKERS = STICKER_CODES.map(code => `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`);

interface StickerPickerProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
    return (
        <div className="absolute bottom-full right-0 mb-3 w-[280px] sm:w-[320px] bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Анимированные стикеры</h4>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {STICKERS.map((url, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            onSelect(url);
                            onClose();
                        }}
                        className="aspect-square p-2 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                        <img src={url} alt="Sticker" className="w-10 h-10 object-contain drop-shadow-lg" loading="lazy" />
                    </button>
                ))}
            </div>
            <div className="mt-3 text-[9px] text-center text-slate-500 uppercase tracking-widest bg-white/5 py-1.5 rounded-lg">Noto Animated Emojis</div>
        </div>
    );
}
