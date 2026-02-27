import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarPreview } from './avatar/AvatarPreview';
import {
  AvatarConfig, DEFAULT_MALE, DEFAULT_FEMALE, PRESETS,
  SKIN_TONES, HAIR_STYLES_MALE, HAIR_STYLES_FEMALE, HAIR_COLORS,
  EYES_OPTIONS, EYEBROW_OPTIONS, MOUTH_OPTIONS, BEARD_OPTIONS,
  CLOTHES_OPTIONS, ACCESSORY_OPTIONS, randomAvatar,
} from './avatar/avatarData';

/* ─── Backward compat ─── */
export interface AvatarResult {
  emoji: string;
  face: string;
  hair: string;
  hairColor: string;
  accessory: string;
  avatarConfig?: AvatarConfig;
}

type Tab = 'head' | 'face' | 'style' | 'presets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result: AvatarResult) => void;
  initial?: AvatarResult;
}

/* ─── Section Label ─── */
const Sec: React.FC<{children: React.ReactNode}> = ({children}) => (
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 mt-5 first:mt-0">{children}</p>
);

/* ─── Option button ─── */
const Opt: React.FC<{label:string; active:boolean; onClick:()=>void}> = ({label,active,onClick}) => (
  <button onClick={onClick}
    className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-200 ${
      active
        ? 'bg-[#7c5cff]/15 text-white border-[#7c5cff]/40 shadow-[0_0_12px_rgba(124,92,255,0.2)]'
        : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-200'
    }`}
  >{label}</button>
);

/* ─── Color swatch ─── */
const Swatch: React.FC<{color:string; active:boolean; onClick:()=>void}> = ({color,active,onClick}) => (
  <button onClick={onClick}
    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
      active ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent'
    }`}
    style={{ backgroundColor: color }}
  />
);

/* ═══════════════════════════════════════════════════ */
export const AvatarBuilderModal: React.FC<Props> = ({ isOpen, onClose, onSave, initial }) => {
  const [tab, setTab] = React.useState<Tab>('head');
  const [cfg, setCfg] = React.useState<AvatarConfig>(() => {
    if (initial?.avatarConfig) return initial.avatarConfig;
    return DEFAULT_MALE;
  });

  const upd = (partial: Partial<AvatarConfig>) => setCfg(prev => ({ ...prev, ...partial }));
  const hairStyles = cfg.gender === 'male' ? HAIR_STYLES_MALE : HAIR_STYLES_FEMALE;

  const handleSave = () => {
    const result: AvatarResult = {
      emoji: '🧑',
      face: cfg.eyes,
      hair: cfg.hairStyle,
      hairColor: cfg.hairColor,
      accessory: cfg.accessories,
      avatarConfig: cfg,
    };
    onSave(result);
    onClose();
  };

  const handleRandom = () => setCfg(randomAvatar(cfg.gender));

  const handleGender = (g: 'male' | 'female') => {
    setCfg(g === 'male' ? { ...DEFAULT_MALE } : { ...DEFAULT_FEMALE });
  };

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'head', label: 'ГОЛОВА', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
    { id: 'face', label: 'ЛИЦО', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg> },
    { id: 'style', label: 'СТИЛЬ', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg> },
    { id: 'presets', label: 'ГОТОВЫЕ', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-lg"/>

        <motion.div
          className="relative w-[880px] max-w-[95vw] h-[560px] max-h-[90vh] rounded-[28px] overflow-hidden border border-white/[0.08] flex"
          style={{ background: 'linear-gradient(135deg, #0b1220 0%, #111a2e 50%, #0d1526 100%)', boxShadow: '0 0 80px rgba(124,92,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)' }}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={e => e.stopPropagation()}
        >
          {/* ══ LEFT: Live Preview ══ */}
          <div className="w-[40%] flex flex-col items-center justify-center relative border-r border-white/[0.04] px-6">
            {/* Gender toggle */}
            <div className="absolute top-5 left-5 flex gap-2">
              <button onClick={() => handleGender('male')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${cfg.gender === 'male' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'}`}
              >Муж</button>
              <button onClick={() => handleGender('female')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${cfg.gender === 'female' ? 'bg-pink-500/15 text-pink-400 border-pink-500/30' : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'}`}
              >Жен</button>
            </div>

            {/* Avatar Preview */}
            <div className="relative">
              <div className="w-[200px] h-[200px] rounded-full bg-[#111a2e] border border-white/[0.06] flex items-center justify-center shadow-[0_0_40px_rgba(124,92,255,0.08)]">
                <AvatarPreview config={cfg} size={180} />
              </div>
              {/* Random button */}
              <button onClick={handleRandom}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#2a3a50] transition-all active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>

            {/* Save button */}
            <button onClick={handleSave}
              className="mt-8 w-[260px] py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] text-white transition-all active:scale-[0.97] hover:shadow-[0_0_30px_rgba(255,122,24,0.3)]"
              style={{ background: 'linear-gradient(90deg, #ff7a18 0%, #e74c3c 100%)' }}
            >ПРОВЕРИТЬ ВИД ✓</button>
          </div>

          {/* ══ RIGHT: Config Tabs ══ */}
          <div className="w-[60%] flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-white/[0.06] px-4 pt-3 relative">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1 pb-3 pt-1 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${
                    tab === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {tab === t.id && <motion.div layoutId="tabline" className="absolute bottom-0 left-2 right-2 h-[2px] bg-orange-500 rounded-full"/>}
                </button>
              ))}
              {/* Close */}
              <button onClick={onClose} className="absolute top-2 right-3 p-1 text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                  {tab === 'head' && (
                    <>
                      <Sec>Тон кожи</Sec>
                      <div className="flex gap-2 flex-wrap">{SKIN_TONES.map(c => <Swatch key={c} color={c} active={cfg.skinTone === c} onClick={() => upd({ skinTone: c })}/>)}</div>
                      <Sec>Причёска</Sec>
                      <div className="grid grid-cols-4 gap-2">{hairStyles.map(h => <Opt key={h.id} label={h.label} active={cfg.hairStyle === h.id} onClick={() => upd({ hairStyle: h.id })}/>)}</div>
                      <Sec>Цвет волос</Sec>
                      <div className="flex gap-2 flex-wrap">{HAIR_COLORS.map(c => <Swatch key={c} color={c} active={cfg.hairColor === c} onClick={() => upd({ hairColor: c })}/>)}</div>
                    </>
                  )}
                  {tab === 'face' && (
                    <>
                      <Sec>Глаза</Sec>
                      <div className="grid grid-cols-4 gap-2">{EYES_OPTIONS.map(o => <Opt key={o.id} label={o.label} active={cfg.eyes === o.id} onClick={() => upd({ eyes: o.id })}/>)}</div>
                      <Sec>Брови</Sec>
                      <div className="grid grid-cols-4 gap-2">{EYEBROW_OPTIONS.map(o => <Opt key={o.id} label={o.label} active={cfg.eyebrows === o.id} onClick={() => upd({ eyebrows: o.id })}/>)}</div>
                      <Sec>Рот</Sec>
                      <div className="grid grid-cols-4 gap-2">{MOUTH_OPTIONS.map(o => <Opt key={o.id} label={o.label} active={cfg.mouth === o.id} onClick={() => upd({ mouth: o.id })}/>)}</div>
                      {cfg.gender === 'male' && (
                        <>
                          <Sec>Борода</Sec>
                          <div className="grid grid-cols-4 gap-2">{BEARD_OPTIONS.map(o => <Opt key={o.id} label={o.label} active={cfg.beard === o.id} onClick={() => upd({ beard: o.id })}/>)}</div>
                        </>
                      )}
                    </>
                  )}
                  {tab === 'style' && (
                    <>
                      <Sec>Одежда</Sec>
                      <div className="grid grid-cols-4 gap-2">{CLOTHES_OPTIONS.map(o => <Opt key={o.id} label={o.label} active={cfg.clothes === o.id} onClick={() => upd({ clothes: o.id })}/>)}</div>
                      <Sec>Аксессуары</Sec>
                      <div className="grid grid-cols-4 gap-2">{ACCESSORY_OPTIONS.map(o => <Opt key={o.id} label={o.label} active={cfg.accessories === o.id} onClick={() => upd({ accessories: o.id })}/>)}</div>
                    </>
                  )}
                  {tab === 'presets' && (
                    <>
                      <Sec>Готовые варианты</Sec>
                      <div className="grid grid-cols-3 gap-3">
                        {PRESETS.map((p, i) => (
                          <button key={i} onClick={() => setCfg(p)}
                            className={`rounded-[18px] p-3 border transition-all duration-200 hover:scale-[1.03] flex items-center justify-center ${
                              JSON.stringify(cfg) === JSON.stringify(p)
                                ? 'border-orange-500/50 bg-orange-500/[0.06] shadow-[0_0_16px_rgba(255,122,24,0.15)]'
                                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            <AvatarPreview config={p} size={90}/>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
