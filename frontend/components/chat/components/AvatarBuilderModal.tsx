import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Avatar Parts ─── */
const FACES = [
  { id: 'face1', emoji: '😐', label: 'Базовый' },
  { id: 'face2', emoji: '🙂', label: 'Мягкий' },
  { id: 'face3', emoji: '😊', label: 'Добрый' },
  { id: 'face4', emoji: '😎', label: 'Крутой' },
];

const HAIRS = [
  { id: 'none', label: 'Нет' },
  { id: 'short', label: 'Короткие' },
  { id: 'medium', label: 'Средние' },
  { id: 'long', label: 'Длинные' },
  { id: 'curly', label: 'Кудри' },
  { id: 'hat', label: 'Шапка' },
];

const HAIR_COLORS = [
  '#1C1C1C', '#3B2219', '#4A3728', '#8B6C42',
  '#C4A35A', '#E8C97E', '#B22222', '#D35400',
  '#6B6B6B', '#F5F5F5',
];

const ACCESSORIES = [
  { id: 'none', label: 'Нет' },
  { id: 'glasses', label: 'Очки' },
  { id: 'sunglasses', label: 'Солнечные' },
  { id: 'earring', label: 'Серьги' },
  { id: 'chain', label: 'Цепочка' },
];

// Compose emoji based on selections
const AVATAR_MAP: Record<string, Record<string, string>> = {
  face1: { none: '😐', short: '🧑', medium: '🧑', long: '🧑‍🦱', curly: '🧑‍🦱', hat: '🧑' },
  face2: { none: '🙂', short: '👨', medium: '👨', long: '👨‍🦱', curly: '👨‍🦱', hat: '👨' },
  face3: { none: '😊', short: '👩', medium: '👩', long: '👩‍🦱', curly: '👩‍🦱', hat: '👩' },
  face4: { none: '😎', short: '🧔', medium: '🧔', long: '🧔‍♂️', curly: '🧔', hat: '🧔' },
};

export interface AvatarResult {
  emoji: string;
  face: string;
  hair: string;
  hairColor: string;
  accessory: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result: AvatarResult) => void;
  initial?: AvatarResult;
}

export const AvatarBuilderModal: React.FC<Props> = ({ isOpen, onClose, onSave, initial }) => {
  const [face, setFace] = React.useState(initial?.face || 'face2');
  const [hair, setHair] = React.useState(initial?.hair || 'short');
  const [hairColor, setHairColor] = React.useState(initial?.hairColor || '#1C1C1C');
  const [accessory, setAccessory] = React.useState(initial?.accessory || 'none');

  const currentEmoji = AVATAR_MAP[face]?.[hair] || '👤';

  const handleSave = () => {
    onSave({ emoji: currentEmoji, face, hair, hairColor, accessory });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-[360px] bg-[#0f172a] rounded-2xl border border-white/10 overflow-hidden"
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Создать аватар</h3>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Live Preview */}
          <div className="flex justify-center py-4">
            <div className="w-24 h-24 rounded-full bg-[#1a2235] border-2 border-white/10 flex items-center justify-center">
              <span className="text-5xl">{currentEmoji}</span>
            </div>
          </div>

          {/* Options */}
          <div className="px-5 pb-5 space-y-5 max-h-[340px] overflow-y-auto no-scrollbar">
            {/* Face */}
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Лицо</label>
              <div className="flex gap-2">
                {FACES.map(f => (
                  <button key={f.id} onClick={() => setFace(f.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${face === f.id ? 'border-orange-400 bg-white/5 scale-110' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}
                  >{f.emoji}</button>
                ))}
              </div>
            </div>

            {/* Hair */}
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Причёска</label>
              <div className="flex flex-wrap gap-1.5">
                {HAIRS.map(h => (
                  <button key={h.id} onClick={() => setHair(h.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${hair === h.id ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                  >{h.label}</button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Цвет волос</label>
              <div className="flex gap-2 flex-wrap">
                {HAIR_COLORS.map(c => (
                  <button key={c} onClick={() => setHairColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${hairColor === c ? 'border-orange-400 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Accessories */}
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Аксессуары</label>
              <div className="flex flex-wrap gap-1.5">
                {ACCESSORIES.map(a => (
                  <button key={a.id} onClick={() => setAccessory(a.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${accessory === a.id ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                  >{a.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="px-5 pb-5">
            <button onClick={handleSave}
              className="w-full py-3 rounded-xl text-[12px] font-black uppercase tracking-[0.12em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98]"
            >Сохранить</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
