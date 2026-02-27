import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarPreview, AvatarConfig, DEFAULT_AVATAR_CONFIG } from './AvatarPreview';

/* ═══ OPTIONS DATA ═══ */
const SKIN_TONES = ['#FFDBB4','#F5C99A','#E8A56A','#C98B5E','#A0714F','#6B4226','#4A2D12'];
const HAIR_COLORS = ['#1C1C1C','#3B2219','#4A3728','#8B6C42','#C4A35A','#E8C97E','#D35400','#B22222','#E91E63','#F5F5F5'];

const HAIR_M = ['none','short','medium','buzz','slickback','curly','afro','mohawk','shaggy','dreads','hat','turban','beanie'];
const HAIR_F = ['none','short','medium','long','curly','ponytail','afro','shaggy','dreads','hat','turban','beanie'];
const HAIR_LABELS: Record<string,string> = {
  none:'Нет',short:'Короткие',medium:'Средние',long:'Длинные',curly:'Кудри',buzz:'Ёжик',
  slickback:'Зачёс',afro:'Афро',mohawk:'Ирокез',shaggy:'Шегги',dreads:'Дреды',ponytail:'Хвост',
  hat:'Шляпа',turban:'Тюрбан',beanie:'Шапка',
};

const EYES = ['default','happy','closed','wink','surprised','squint','hearts','side','dizzy','cry'];
const EYES_L: Record<string,string> = {
  default:'Обычные',happy:'Счастливые',closed:'Закрытые',wink:'Подмигивание',
  surprised:'Удивление',squint:'Прищур',hearts:'Сердечки',side:'В сторону',dizzy:'Головокруж.',cry:'Плачущие',
};

const EYEBROWS = ['default','angry','raised','sad','unibrow','flat','none'];
const EYEBROWS_L: Record<string,string> = {
  default:'Обычные',angry:'Злые',raised:'Восторжен.',sad:'Грустные',unibrow:'Монобровь',flat:'Прямые',none:'Нет',
};

const MOUTHS = ['smile','grin','sad','open','neutral','smirk','tongue','grimace','scream','serious'];
const MOUTHS_L: Record<string,string> = {
  smile:'Улыбка',grin:'Ухмылка',sad:'Грустный',open:'Крик',neutral:'Обычный',
  smirk:'Усмешка',tongue:'Язык',grimace:'Гримаса',scream:'О!',serious:'Серьёзный',
};

const BEARDS = ['none','stubble','goatee','full','mustache','vandyke'];
const BEARDS_L: Record<string,string> = {
  none:'Нет',stubble:'Щетина',goatee:'Козлинная',full:'Полная',mustache:'Усы',vandyke:'Вандайк',
};

const CLOTHES = ['crew','vneck','hoodie','blazer','tshirt','collared','tank','turtleneck','overall'];
const CLOTHES_L: Record<string,string> = {
  crew:'Круглый вырез',vneck:'V-образный',hoodie:'Худи',blazer:'Пиджак',tshirt:'Футболка',
  collared:'Воротник',tank:'Майка',turtleneck:'Водолазка',overall:'Комбинезон',
};

const ACCESSORIES = ['none','glasses','glasses2','round','sunglasses','wayfarers','earring','necklace'];
const ACC_L: Record<string,string> = {
  none:'Нет',glasses:'Очки 1',glasses2:'Очки 2',round:'Круглые',
  sunglasses:'Солнечные',wayfarers:'Вайфареры',earring:'Серьги',necklace:'Цепочка',
};

/* ═══ PRESETS ═══ */
const PRESETS: AvatarConfig[] = [
  { gender:'male',skinTone:'#FFDBB4',hairStyle:'short',hairColor:'#1C1C1C',eyes:'default',eyebrows:'default',mouth:'smile',beard:'none',clothes:'blazer',accessories:'none' },
  { gender:'male',skinTone:'#C98B5E',hairStyle:'curly',hairColor:'#3B2219',eyes:'happy',eyebrows:'raised',mouth:'grin',beard:'stubble',clothes:'hoodie',accessories:'glasses' },
  { gender:'male',skinTone:'#E8A56A',hairStyle:'buzz',hairColor:'#4A3728',eyes:'squint',eyebrows:'flat',mouth:'serious',beard:'full',clothes:'tshirt',accessories:'sunglasses' },
  { gender:'female',skinTone:'#FFDBB4',hairStyle:'long',hairColor:'#E8C97E',eyes:'happy',eyebrows:'raised',mouth:'smile',beard:'none',clothes:'collared',accessories:'earring' },
  { gender:'female',skinTone:'#F5C99A',hairStyle:'ponytail',hairColor:'#B22222',eyes:'wink',eyebrows:'default',mouth:'smirk',beard:'none',clothes:'vneck',accessories:'necklace' },
  { gender:'female',skinTone:'#C98B5E',hairStyle:'curly',hairColor:'#1C1C1C',eyes:'default',eyebrows:'default',mouth:'grin',beard:'none',clothes:'hoodie',accessories:'round' },
  { gender:'male',skinTone:'#6B4226',hairStyle:'afro',hairColor:'#1C1C1C',eyes:'default',eyebrows:'angry',mouth:'neutral',beard:'goatee',clothes:'turtleneck',accessories:'none' },
  { gender:'male',skinTone:'#A0714F',hairStyle:'dreads',hairColor:'#3B2219',eyes:'side',eyebrows:'default',mouth:'smile',beard:'mustache',clothes:'tank',accessories:'wayfarers' },
  { gender:'female',skinTone:'#E8A56A',hairStyle:'shaggy',hairColor:'#D35400',eyes:'hearts',eyebrows:'raised',mouth:'tongue',beard:'none',clothes:'overall',accessories:'glasses2' },
];

/* ═══ RANDOM ═══ */
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
function randomAvatar(gender: 'male'|'female'): AvatarConfig {
  const hairs = gender === 'female' ? HAIR_F : HAIR_M;
  return {
    gender, skinTone: pick(SKIN_TONES), hairStyle: pick(hairs), hairColor: pick(HAIR_COLORS),
    eyes: pick(EYES), eyebrows: pick(EYEBROWS), mouth: pick(MOUTHS),
    beard: gender === 'male' ? pick(BEARDS) : 'none',
    clothes: pick(CLOTHES), accessories: pick(ACCESSORIES),
  };
}

/* ═══ SUB-COMPONENTS ═══ */
type Tab = 'head'|'face'|'style'|'presets';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id:'head', label:'ГОЛОВА', icon:'👤' },
  { id:'face', label:'ЛИЦО',  icon:'👁' },
  { id:'style',label:'СТИЛЬ', icon:'👕' },
  { id:'presets',label:'ГОТОВЫЕ',icon:'⭐' },
];

const Section: React.FC<{title:string;children:React.ReactNode}> = ({title,children}) => (
  <div className="mb-5">
    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2.5 block">{title}</label>
    {children}
  </div>
);

const Swatch: React.FC<{color:string;active:boolean;onClick:()=>void}> = ({color,active,onClick}) => (
  <button onClick={onClick} className={`w-8 h-8 rounded-full border-2 transition-all ${active ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}`}
    style={{ backgroundColor: color }} />
);

const Chip: React.FC<{label:string;active:boolean;onClick:()=>void}> = ({label,active,onClick}) => (
  <button onClick={onClick}
    className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all ${active
      ? 'bg-[#7c5cff]/15 text-white border-[#7c5cff]/40 shadow-[0_0_12px_rgba(124,92,255,0.2)]'
      : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06]'}`}>
    {label}
  </button>
);

/* ═══ EXPORT: AvatarResult (backwards compat) ═══ */
export interface AvatarResult {
  emoji: string;
  face: string;
  hair: string;
  hairColor: string;
  accessory: string;
  avatarConfig?: AvatarConfig;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result: AvatarResult) => void;
  initial?: AvatarResult;
}

/* ═══ MAIN MODAL ═══ */
export const AvatarBuilderModal: React.FC<Props> = ({ isOpen, onClose, onSave, initial }) => {
  const initConfig = initial?.avatarConfig || DEFAULT_AVATAR_CONFIG;
  const [cfg, setCfg] = React.useState<AvatarConfig>(initConfig);
  const [tab, setTab] = React.useState<Tab>('head');

  const set = <K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: val }));

  const hairs = cfg.gender === 'female' ? HAIR_F : HAIR_M;

  const handleSave = () => {
    onSave({
      emoji: '🧑', face: 'custom', hair: cfg.hairStyle,
      hairColor: cfg.hairColor, accessory: cfg.accessories,
      avatarConfig: cfg,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-[90vw] max-w-[820px] max-h-[90vh] bg-gradient-to-br from-[#0b1220] to-[#0f1a30] rounded-[28px] border border-white/[0.06] overflow-hidden flex flex-col md:flex-row shadow-[0_0_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]"
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={e => e.stopPropagation()}
        >
          {/* ═══ LEFT: Preview ═══ */}
          <div className="w-full md:w-[40%] flex flex-col items-center justify-center p-8 gap-5 bg-gradient-to-b from-[#0a0f1c] to-[#0d1525]">
            {/* Gender toggle */}
            <div className="flex gap-2 mb-2">
              {(['male','female'] as const).map(g => (
                <button key={g} onClick={() => { set('gender', g); if (g==='female') set('beard','none'); }}
                  className={`px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${cfg.gender===g ? 'bg-white/[0.08] text-white border-white/20' : 'bg-white/[0.02] text-slate-500 border-white/[0.06] hover:bg-white/[0.04]'}`}>
                  {g==='male'?'МУЖ':'ЖЕН'}
                </button>
              ))}
            </div>

            <div className="relative">
              <AvatarPreview config={cfg} size={180} />
              {/* Random button */}
              <button onClick={() => setCfg(randomAvatar(cfg.gender))}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-slate-400 hover:text-orange-400 hover:border-orange-400/30 transition-all active:scale-90 shadow-lg">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <button onClick={handleSave}
              className="w-full max-w-[280px] py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 transition-all active:scale-[0.97] shadow-[0_4px_20px_rgba(255,165,0,0.25)]">
              ПРОВЕРИТЬ ВИД ✓
            </button>
          </div>

          {/* ═══ RIGHT: Tabs ═══ */}
          <div className="w-full md:w-[60%] flex flex-col border-l border-white/[0.04]">
            {/* Tab bar */}
            <div className="flex items-center border-b border-white/[0.06] px-2 relative">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors relative ${tab===t.id?'text-white':'text-slate-500 hover:text-slate-300'}`}>
                  <span className="text-sm">{t.icon}</span>
                  {t.label}
                  {tab===t.id && <motion.div layoutId="tabLine" className="absolute bottom-0 left-2 right-2 h-[2px] bg-orange-500 rounded-full"/>}
                </button>
              ))}
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors ml-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.15}}>

                  {tab === 'head' && <>
                    <Section title="Тон кожи">
                      <div className="flex gap-2.5 flex-wrap">{SKIN_TONES.map(c=><Swatch key={c} color={c} active={cfg.skinTone===c} onClick={()=>set('skinTone',c)}/>)}</div>
                    </Section>
                    <Section title="Причёска">
                      <div className="grid grid-cols-4 gap-1.5">{hairs.map(h=><Chip key={h} label={HAIR_LABELS[h]||h} active={cfg.hairStyle===h} onClick={()=>set('hairStyle',h)}/>)}</div>
                    </Section>
                    <Section title="Цвет волос">
                      <div className="flex gap-2.5 flex-wrap">{HAIR_COLORS.map(c=><Swatch key={c} color={c} active={cfg.hairColor===c} onClick={()=>set('hairColor',c)}/>)}</div>
                    </Section>
                  </>}

                  {tab === 'face' && <>
                    <Section title="Глаза">
                      <div className="grid grid-cols-4 gap-1.5">{EYES.map(e=><Chip key={e} label={EYES_L[e]||e} active={cfg.eyes===e} onClick={()=>set('eyes',e)}/>)}</div>
                    </Section>
                    <Section title="Брови">
                      <div className="grid grid-cols-4 gap-1.5">{EYEBROWS.map(e=><Chip key={e} label={EYEBROWS_L[e]||e} active={cfg.eyebrows===e} onClick={()=>set('eyebrows',e)}/>)}</div>
                    </Section>
                    <Section title="Рот">
                      <div className="grid grid-cols-4 gap-1.5">{MOUTHS.map(m=><Chip key={m} label={MOUTHS_L[m]||m} active={cfg.mouth===m} onClick={()=>set('mouth',m)}/>)}</div>
                    </Section>
                    {cfg.gender==='male' && <Section title="Борода">
                      <div className="grid grid-cols-4 gap-1.5">{BEARDS.map(b=><Chip key={b} label={BEARDS_L[b]||b} active={cfg.beard===b} onClick={()=>set('beard',b)}/>)}</div>
                    </Section>}
                  </>}

                  {tab === 'style' && <>
                    <Section title="Одежда">
                      <div className="grid grid-cols-4 gap-1.5">{CLOTHES.map(c=><Chip key={c} label={CLOTHES_L[c]||c} active={cfg.clothes===c} onClick={()=>set('clothes',c)}/>)}</div>
                    </Section>
                    <Section title="Аксессуары">
                      <div className="grid grid-cols-4 gap-1.5">{ACCESSORIES.map(a=><Chip key={a} label={ACC_L[a]||a} active={cfg.accessories===a} onClick={()=>set('accessories',a)}/>)}</div>
                    </Section>
                  </>}

                  {tab === 'presets' && <Section title="Готовые варианты">
                    <div className="grid grid-cols-3 gap-3">
                      {PRESETS.map((p,i) => (
                        <button key={i} onClick={() => setCfg(p)}
                          className="group rounded-[18px] bg-white/[0.02] border border-white/[0.06] p-3 flex flex-col items-center gap-2 transition-all hover:scale-[1.03] hover:border-orange-400/30 hover:shadow-[0_0_16px_rgba(255,165,0,0.1)] active:scale-[0.98]">
                          <AvatarPreview config={p} size={80} />
                          <span className="text-[9px] text-slate-500 font-medium uppercase">{p.gender==='male'?'Муж':'Жен'} #{i+1}</span>
                        </button>
                      ))}
                    </div>
                  </Section>}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export type { AvatarConfig };
export { DEFAULT_AVATAR_CONFIG };
