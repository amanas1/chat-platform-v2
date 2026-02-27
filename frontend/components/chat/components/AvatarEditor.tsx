import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Avatar Parts Config ─── */
const SKIN_TONES = ['#FFDBB5', '#EDB98A', '#D08B5B', '#AE5D29', '#613915', '#3B2219', '#F5D6C3'];
const HAIR_COLORS = ['#2C1B0E', '#4A3728', '#8B6C42', '#C4A35A', '#E8C97E', '#B22222', '#D35400', '#1C1C1C', '#6B6B6B', '#F5F5F5'];

const MALE_HAIRSTYLES = ['Короткая', 'Классика', 'Ёжик', 'Фейд', 'Волна', 'Афро', 'Лысый', 'Шапка'];
const FEMALE_HAIRSTYLES = ['Длинные', 'Каре', 'Хвост', 'Пучок', 'Кудри', 'Косы', 'Боб', 'Волна'];

const MALE_EYES = ['Обычные', 'Узкие', 'Большие', 'Очки', 'Солнечные'];
const FEMALE_EYES = ['Обычные', 'Большие', 'Кошачьи', 'Очки', 'Солнечные'];

const BROWS = ['Прямые', 'Дуги', 'Густые', 'Тонкие', 'Без'];
const MOUTHS = ['Улыбка', 'Спокойно', 'Серьёзно', 'Открытый', 'Ухмылка'];

const MALE_CLOTHING = ['Пиджак и рубашка', 'Худи', 'Футболка', 'Комбинезон', 'Свитер'];
const FEMALE_CLOTHING = ['Платье', 'Блуза', 'Худи', 'Футболка', 'Кардиган'];

const ACCESSORIES = ['Без', 'Очки 1', 'Солнечные', 'Серьги', 'Цепочка'];

// Simple emoji-based avatar preview compositions
const AVATAR_MALE_EMOJIS = ['👨', '👨‍🦱', '👨‍🦳', '👨‍🦰', '🧔', '👨‍🦲', '🧑', '🧑‍🦱'];
const AVATAR_FEMALE_EMOJIS = ['👩', '👩‍🦱', '👩‍🦳', '👩‍🦰', '👱‍♀️', '👩‍🦲', '🧑‍🦰', '🧑‍🦱'];

export interface AvatarConfig {
  gender: 'male' | 'female';
  skinTone: number;
  hairstyle: number;
  hairColor: number;
  eyes: number;
  brows: number;
  mouth: number;
  clothing: number;
  accessory: number;
  emoji: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'male',
  skinTone: 0,
  hairstyle: 1,
  hairColor: 0,
  eyes: 0,
  brows: 0,
  mouth: 0,
  clothing: 0,
  accessory: 0,
  emoji: '👨',
};

interface AvatarEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AvatarConfig) => void;
  initialConfig?: AvatarConfig;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ isOpen, onClose, onSave, initialConfig }) => {
  const [step, setStep] = React.useState<'gender' | 'customize'>( initialConfig ? 'customize' : 'gender');
  const [config, setConfig] = React.useState<AvatarConfig>(initialConfig || DEFAULT_AVATAR);
  const [subTab, setSubTab] = React.useState<'head' | 'face' | 'style'>('head');

  const update = (key: keyof AvatarConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const randomize = () => {
    const isMale = config.gender === 'male';
    const emojis = isMale ? AVATAR_MALE_EMOJIS : AVATAR_FEMALE_EMOJIS;
    setConfig({
      ...config,
      skinTone: Math.floor(Math.random() * SKIN_TONES.length),
      hairstyle: Math.floor(Math.random() * (isMale ? MALE_HAIRSTYLES : FEMALE_HAIRSTYLES).length),
      hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
      eyes: Math.floor(Math.random() * (isMale ? MALE_EYES : FEMALE_EYES).length),
      brows: Math.floor(Math.random() * BROWS.length),
      mouth: Math.floor(Math.random() * MOUTHS.length),
      clothing: Math.floor(Math.random() * (isMale ? MALE_CLOTHING : FEMALE_CLOTHING).length),
      accessory: Math.floor(Math.random() * ACCESSORIES.length),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    });
  };

  const selectGender = (g: 'male' | 'female') => {
    const emojis = g === 'male' ? AVATAR_MALE_EMOJIS : AVATAR_FEMALE_EMOJIS;
    setConfig({ ...DEFAULT_AVATAR, gender: g, emoji: emojis[0] });
    setStep('customize');
  };

  const hairstyles = config.gender === 'male' ? MALE_HAIRSTYLES : FEMALE_HAIRSTYLES;
  const eyes = config.gender === 'male' ? MALE_EYES : FEMALE_EYES;
  const clothing = config.gender === 'male' ? MALE_CLOTHING : FEMALE_CLOTHING;
  const emojis = config.gender === 'male' ? AVATAR_MALE_EMOJIS : AVATAR_FEMALE_EMOJIS;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="w-[480px] max-h-[85vh] bg-[#0f172a] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white transition-colors z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <AnimatePresence mode="wait">
            {step === 'gender' ? (
              /* ═══ STEP 1: Gender Selection ═══ */
              <motion.div key="gender" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 flex flex-col items-center">
                <h2 className="text-[18px] font-black text-white uppercase tracking-wider mb-8 text-center">
                  Выберите, как вы хотите выглядеть.
                </h2>

                <div className="flex gap-4 w-full">
                  {/* Male */}
                  <button 
                    onClick={() => selectGender('male')}
                    className="flex-1 p-6 rounded-2xl bg-[#1a2744] border border-white/10 hover:border-blue-400/40 hover:bg-[#1e2f52] transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className="w-24 h-24 rounded-full bg-[#243352] flex items-center justify-center">
                      <span className="text-5xl">👨</span>
                    </div>
                    <span className="text-[14px] font-bold text-white/80 uppercase tracking-wider group-hover:text-white">Мужской</span>
                  </button>

                  {/* Female */}
                  <button 
                    onClick={() => selectGender('female')}
                    className="flex-1 p-6 rounded-2xl bg-[#2a1a33] border border-white/10 hover:border-pink-400/40 hover:bg-[#351e42] transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className="w-24 h-24 rounded-full bg-[#3d2248] flex items-center justify-center">
                      <span className="text-5xl">👩</span>
                    </div>
                    <span className="text-[14px] font-bold text-white/80 uppercase tracking-wider group-hover:text-white">Женский</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ═══ STEP 2: Customization ═══ */
              <motion.div key="customize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                {/* Avatar Preview */}
                <div className="flex items-center justify-center py-5 gap-4">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white/15"
                    style={{ backgroundColor: SKIN_TONES[config.skinTone] + '33' }}
                  >
                    <span className="text-4xl">{config.emoji}</span>
                  </div>
                  <button 
                    onClick={randomize}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Случайный вид"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                    </svg>
                  </button>
                </div>

                {/* Sub-Tabs */}
                <div className="flex border-b border-white/[0.06] px-4">
                  {(['head', 'face', 'style'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSubTab(t)}
                      className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all
                        ${subTab === t ? 'text-orange-400 border-orange-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                      {t === 'head' ? 'Глава' : t === 'face' ? 'Лицо' : 'Стиль'}
                    </button>
                  ))}
                </div>

                {/* Sub-Tab Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
                  {subTab === 'head' && (
                    <>
                      {/* Skin Tone */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Тон кожи</label>
                        <div className="flex gap-2">
                          {SKIN_TONES.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => update('skinTone', i)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${config.skinTone === i ? 'border-orange-400 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Hairstyle */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Причёска</label>
                        <div className="grid grid-cols-4 gap-2">
                          {hairstyles.map((h, i) => (
                            <button
                              key={h}
                              onClick={() => { update('hairstyle', i); update('emoji', emojis[i % emojis.length]); }}
                              className={`py-2 px-2 rounded-xl text-[10px] font-medium transition-all border
                                ${config.hairstyle === i ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hair Color */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Цвет волос</label>
                        <div className="flex gap-2 flex-wrap">
                          {HAIR_COLORS.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => update('hairColor', i)}
                              className={`w-7 h-7 rounded-full border-2 transition-all ${config.hairColor === i ? 'border-orange-400 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {subTab === 'face' && (
                    <>
                      {/* Eyes */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Глаза</label>
                        <div className="grid grid-cols-3 gap-2">
                          {eyes.map((e, i) => (
                            <button
                              key={e}
                              onClick={() => update('eyes', i)}
                              className={`py-2.5 px-3 rounded-xl text-[11px] font-medium transition-all border
                                ${config.eyes === i ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Brows */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Брови</label>
                        <div className="grid grid-cols-3 gap-2">
                          {BROWS.map((b, i) => (
                            <button
                              key={b}
                              onClick={() => update('brows', i)}
                              className={`py-2.5 px-3 rounded-xl text-[11px] font-medium transition-all border
                                ${config.brows === i ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mouth */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Рот</label>
                        <div className="grid grid-cols-3 gap-2">
                          {MOUTHS.map((m, i) => (
                            <button
                              key={m}
                              onClick={() => update('mouth', i)}
                              className={`py-2.5 px-3 rounded-xl text-[11px] font-medium transition-all border
                                ${config.mouth === i ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {subTab === 'style' && (
                    <>
                      {/* Clothing */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Одежда</label>
                        <div className="grid grid-cols-2 gap-2">
                          {clothing.map((c, i) => (
                            <button
                              key={c}
                              onClick={() => update('clothing', i)}
                              className={`py-2.5 px-3 rounded-xl text-[11px] font-medium transition-all border
                                ${config.clothing === i ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accessories */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">Аксессуары</label>
                        <div className="grid grid-cols-3 gap-2">
                          {ACCESSORIES.map((a, i) => (
                            <button
                              key={a}
                              onClick={() => update('accessory', i)}
                              className={`py-2.5 px-3 rounded-xl text-[11px] font-medium transition-all border
                                ${config.accessory === i ? 'bg-white/10 text-white border-orange-400/50' : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:bg-white/[0.04]'}`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="shrink-0 p-4 border-t border-white/[0.06] flex gap-3">
                  <button
                    onClick={() => setStep('gender')}
                    className="px-4 py-3 rounded-xl text-[11px] font-semibold text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
                  >
                    ← Пол
                  </button>
                  <button 
                    onClick={() => { onSave(config); onClose(); }}
                    className="flex-1 py-3 rounded-xl text-[12px] font-black uppercase tracking-[0.12em] text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98]"
                  >
                    Проверить вид
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarEditor;
