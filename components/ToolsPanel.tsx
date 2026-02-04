
import React, { useState } from 'react';
import { 
  ThemeName, BaseTheme, Language, VisualizerVariant, VisualizerSettings, 
  AmbienceState, PassportData, AlarmConfig, FxSettings, AudioProcessSettings 
} from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  XMarkIcon, AdjustmentsIcon, MoonIcon, PaletteIcon, 
  SwatchIcon, CloudIcon, MusicNoteIcon, ClockIcon, FireIcon, BellIcon, ChatBubbleIcon
} from './Icons';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  eqGains: number[];
  setEqGain: (index: number, value: number) => void;
  onSetEqValues: (values: number[]) => void;
  sleepTimer: number | null;
  setSleepTimer: (minutes: number | null) => void;
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  baseTheme: BaseTheme;
  setBaseTheme: (mode: BaseTheme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  visualizerVariant: VisualizerVariant;
  setVisualizerVariant: (v: VisualizerVariant) => void;
  vizSettings: VisualizerSettings;
  setVizSettings: (s: VisualizerSettings) => void;
  onStartTutorial: () => void;
  onOpenManual: () => void;
  onOpenProfile: () => void;
  ambience: AmbienceState;
  setAmbience: (a: AmbienceState) => void;
  passport: PassportData;
  alarm: AlarmConfig;
  setAlarm: (a: AlarmConfig) => void;
  onThrowBottle: () => void;
  onCheckBottle: () => void;
  customCardColor: string | null;
  setCustomCardColor: (c: string | null) => void;
  fxSettings: FxSettings;
  setFxSettings: (val: React.SetStateAction<FxSettings>) => void;
  audioEnhancements: AudioProcessSettings;
  setAudioEnhancements: (val: React.SetStateAction<AudioProcessSettings>) => void;
  randomMode: boolean;
  setRandomMode: (val: boolean) => void;
  onGlobalReset?: () => void; // New Prop
}

const VISUALIZERS: { id: VisualizerVariant; name: string }[] = [
  { id: 'galaxy', name: 'Galaxy' },
  { id: 'stage-dancer', name: 'Stage Dancer' },
  { id: 'viz-journey', name: 'Journey' },
  { id: 'rainbow-lines', name: 'Neon' },
  { id: 'mixed-rings', name: 'Rings' },
  { id: 'bubbles', name: 'Bubbles' },
];

const THEMES: ThemeName[] = ['default', 'emerald', 'midnight', 'cyber', 'volcano', 'ocean', 'sakura', 'gold', 'frost', 'forest'];

const EQ_PRESETS = [
    { id: 'flat', name: 'Flat', ru: 'Сброс', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'bass', name: 'Bass', ru: 'Бас', values: [8, 7, 6, 3, 0, 0, 0, 0, 0, 0] },
    { id: 'rock', name: 'Rock', ru: 'Рок', values: [5, 3, 2, 0, -1, -1, 1, 3, 4, 5] },
    { id: 'pop', name: 'Pop', ru: 'Поп', values: [-1, 1, 3, 4, 4, 3, 1, 0, -1, -1] },
    { id: 'jazz', name: 'Jazz', ru: 'Джаз', values: [3, 2, 0, 1, 0, 0, 0, 1, 2, 3] },
    { id: 'vocal', name: 'Vocal', ru: 'Вокал', values: [-3, -3, -1, 1, 4, 5, 4, 2, 0, -1] },
    { id: 'treble', name: 'Treble', ru: 'Высокие', values: [0, 0, 0, 0, 0, 2, 4, 6, 7, 8] },
    { id: 'soft', name: 'Soft', ru: 'Мягко', values: [2, 1, 0, -1, -2, -1, 0, 1, 1, 2] },
];

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  isOpen, onClose,
  eqGains, setEqGain, onSetEqValues,
  sleepTimer, setSleepTimer,
  currentTheme, setTheme, baseTheme, setBaseTheme,
  language, setLanguage,
  visualizerVariant, setVisualizerVariant, vizSettings, setVizSettings,
  onStartTutorial, onOpenManual, onOpenProfile,
  ambience, setAmbience, passport, alarm, setAlarm, onThrowBottle, onCheckBottle,
  customCardColor, setCustomCardColor,
  fxSettings, setFxSettings,
  audioEnhancements, setAudioEnhancements,
  randomMode, setRandomMode,
  onGlobalReset
}) => {
  const [activeTab, setActiveTab] = useState<'viz' | 'eq' | 'look' | 'ambience' | 'fx' | 'timer'>('viz');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!isOpen) return null;

  const updateAmbience = (key: keyof AmbienceState, value: any) => {
    setAmbience({ ...ambience, [key]: value });
  };

  const updateAlarm = (key: keyof AlarmConfig, value: any) => {
      setAlarm({ ...alarm, [key]: value });
  };

  const toggleAlarmDay = (dayIndex: number) => {
      const newDays = alarm.days.includes(dayIndex)
          ? alarm.days.filter(d => d !== dayIndex)
          : [...alarm.days, dayIndex].sort();
      updateAlarm('days', newDays);
  };

  const tabs = [
    { id: 'viz', icon: SwatchIcon, label: t.visualizer },
    { id: 'eq', icon: AdjustmentsIcon, label: t.eq },
    { id: 'look', icon: PaletteIcon, label: t.look },
    { id: 'ambience', icon: CloudIcon, label: t.ambience },
    { id: 'fx', icon: MusicNoteIcon, label: t.fx },
    { id: 'timer', icon: ClockIcon, label: t.sleep },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
       <div className="relative w-full max-w-4xl bg-[var(--panel-bg)] glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] animate-in zoom-in duration-300 border border-[var(--panel-border)]">
          
          <div className="w-full md:w-24 bg-black/20 md:border-r border-b md:border-b-0 border-white/5 p-4 flex md:flex-col items-center justify-center md:justify-start gap-4 overflow-x-auto md:overflow-visible shrink-0 no-scrollbar">
             {tabs.map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                   title={tab.label}
                 >
                   <tab.icon className="w-6 h-6" />
                 </button>
             ))}
             <div className="hidden md:block flex-1"></div>
             <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-red-500/20 transition-all">
                <XMarkIcon className="w-6 h-6" />
             </button>
          </div>

          <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar bg-gradient-to-br from-white/[0.02] to-transparent">
             <div className="flex justify-between items-center mb-8 md:hidden">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{tabs.find(t => t.id === activeTab)?.label}</h2>
                 <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
             </div>

             {activeTab === 'viz' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {VISUALIZERS.map(v => (
                            <button 
                                key={v.id} 
                                onClick={() => setVisualizerVariant(v.id)}
                                disabled={vizSettings.energySaver}
                                className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${visualizerVariant === v.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'} ${vizSettings.energySaver ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                                {t[`viz${v.name.replace(/\s/g,'')}`] || t[v.id.replace('-','')] || v.name}
                            </button>
                        ))}
                    </div>
                    
                    <div className="space-y-4 p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-white uppercase tracking-widest">{t.energySaver}</label>
                            <button onClick={() => setVizSettings({...vizSettings, energySaver: !vizSettings.energySaver})} className={`w-14 h-7 rounded-full relative transition-colors ${vizSettings.energySaver ? 'bg-green-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${vizSettings.energySaver ? 'left-8' : 'left-1'}`}></div>
                            </button>
                        </div>
                        
                        <div className={`space-y-4 transition-opacity duration-300 ${vizSettings.energySaver ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                            <div className="w-full h-px bg-white/5 my-2"></div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 w-16 uppercase">{t.speed}</span>
                                <input type="range" min="0.1" max="3" step="0.1" 
                                    value={vizSettings.speed} 
                                    onChange={(e) => setVizSettings({...vizSettings, speed: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 w-16 uppercase">{t.react}</span>
                                <input type="range" min="0.5" max="3" step="0.1" 
                                    value={vizSettings.scaleY} 
                                    onChange={(e) => setVizSettings({...vizSettings, scaleY: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                             <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500 w-16 uppercase">{t.bright}</span>
                                <input type="range" min="50" max="200" step="10" 
                                    value={vizSettings.brightness} 
                                    onChange={(e) => setVizSettings({...vizSettings, brightness: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 bg-white/5 rounded-2xl">
                         <div className="flex items-center justify-between">
                             <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[var(--text-base)] uppercase tracking-widest">{t.randomMode}</label>
                                <p className="text-[9px] text-slate-500 font-medium leading-tight">{t.randomModeDesc}</p>
                             </div>
                            <button onClick={() => setRandomMode(!randomMode)} className={`w-12 h-6 rounded-full relative transition-colors ${randomMode ? 'bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${randomMode ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {activeTab === 'eq' && (
                 <div className="h-full flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                     <div className="flex justify-between items-end mb-8 h-56 px-2 pb-8">
                         {eqGains.map((gain, i) => (
                             <div key={i} className="relative flex flex-col items-center h-full w-8 group">
                                 <div className="relative flex-1 w-1.5 bg-white/10 rounded-full overflow-visible group-hover:bg-white/20 transition-colors">
                                     <div 
                                        className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-secondary rounded-full transition-all duration-75"
                                        style={{ height: `${((gain + 12) / 24) * 100}%` }}
                                     >
                                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform pointer-events-none"></div>
                                     </div>
                                     <input 
                                       type="range" min="-12" max="12" step="1" 
                                       value={gain} 
                                       onChange={(e) => setEqGain(i, parseFloat(e.target.value))}
                                       className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-20"
                                       style={{ writingMode: 'vertical-lr', direction: 'rtl', appearance: 'slider-vertical' as any, WebkitAppearance: 'slider-vertical' }}
                                       title={`${gain}dB`}
                                     />
                                 </div>
                                 <span className="absolute -bottom-6 text-[9px] font-bold text-slate-500 w-full text-center">{[32,64,125,250,500,'1k','2k','4k','8k','16k'][i]}</span>
                             </div>
                         ))}
                     </div>
                     <div className="grid grid-cols-4 gap-2 px-2 mt-2">
                         {EQ_PRESETS.map(preset => (
                             <button 
                                key={preset.id}
                                onClick={() => onSetEqValues(preset.values)}
                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                    JSON.stringify(eqGains) === JSON.stringify(preset.values) 
                                    ? 'bg-secondary border-secondary text-white shadow-lg shadow-secondary/20'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
                                }`}
                             >
                                 <span className="block mb-1">{language === 'ru' ? preset.ru : preset.name}</span>
                             </button>
                         ))}
                     </div>
                 </div>
             )}

             {activeTab === 'look' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                     <div className="space-y-4">
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.cardColor || 'Color Theme'}</h4>
                         <div className="grid grid-cols-5 gap-3">
                             {THEMES.map(theme => (
                                 <button
                                     key={theme}
                                     onClick={() => setTheme(theme)}
                                     className={`aspect-square rounded-xl transition-all border-2 ${currentTheme === theme ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                     style={{ background: theme === 'default' ? '#bc6ff1' : theme === 'emerald' ? '#10b981' : theme === 'midnight' ? '#6366f1' : theme === 'cyber' ? '#d946ef' : theme === 'volcano' ? '#f97316' : theme === 'ocean' ? '#0ea5e9' : theme === 'sakura' ? '#ec4899' : theme === 'gold' ? '#eab308' : theme === 'frost' ? '#2dd4bf' : '#84cc16' }}
                                 />
                             ))}
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.interfaceLanguage}</h4>
                             <div className="flex bg-white/5 rounded-xl p-1">
                                 <button onClick={() => setLanguage('en')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${language === 'en' ? 'bg-primary text-white' : 'text-slate-400'}`}>EN</button>
                                 <button onClick={() => setLanguage('ru')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${language === 'ru' ? 'bg-primary text-white' : 'text-slate-400'}`}>RU</button>
                             </div>
                         </div>
                         <div className="space-y-2">
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mode</h4>
                             <div className="flex bg-white/5 rounded-xl p-1">
                                 <button onClick={() => setBaseTheme('dark')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${baseTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Dark</button>
                                 <button onClick={() => setBaseTheme('light')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${baseTheme === 'light' ? 'bg-slate-200 text-black' : 'text-slate-400'}`}>Light</button>
                             </div>
                         </div>
                     </div>
                     
                     <div className="space-y-2">
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.cardColor || 'Card Tint'}</h4>
                         <div className="flex gap-3">
                             {['255, 255, 255', '30, 41, 59', '15, 23, 42'].map(c => (
                                 <button 
                                    key={c}
                                    onClick={() => setCustomCardColor(c === customCardColor ? null : c)}
                                    className={`h-8 flex-1 rounded-lg border transition-all ${customCardColor === c ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5'}`}
                                    style={{ backgroundColor: `rgba(${c}, 0.5)` }}
                                 />
                             ))}
                             <button onClick={() => setCustomCardColor(null)} className="h-8 flex-1 rounded-lg border border-white/10 bg-transparent text-[10px] text-slate-400 font-bold uppercase hover:bg-white/5">{t.reset}</button>
                         </div>
                     </div>

                     <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                         <button onClick={onOpenProfile} className="py-3 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2">
                             <ChatBubbleIcon className="w-3.5 h-3.5" />
                             {t.editProfile}
                         </button>
                          <button onClick={onStartTutorial} className="py-3 bg-white/5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-all">Manual</button>
                     </div>

                     {/* GLOBAL RESET BUTTON */}
                     {onGlobalReset && (
                         <div className="pt-4 border-t border-white/5">
                             <button 
                                 onClick={onGlobalReset} 
                                 className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 text-xs font-black uppercase tracking-widest transition-all"
                             >
                                 {t.resetApp || "Reset App"}
                             </button>
                         </div>
                     )}
                 </div>
             )}

             {activeTab === 'ambience' && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                     <div className="space-y-4">
                         {[
                             { id: 'rain', label: t.rain, vol: ambience.rainVolume },
                             { id: 'fire', label: 'Fire', vol: ambience.fireVolume },
                         ].map(item => (
                             <div key={item.id} className="flex items-center gap-4">
                                 <span className="w-16 text-xs font-bold text-slate-400 uppercase">{item.label}</span>
                                 <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={item.vol}
                                    onChange={(e) => updateAmbience(`${item.id}Volume` as any, parseFloat(e.target.value))}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full"
                                 />
                                 <span className="w-8 text-right text-xs font-mono text-slate-500">{Math.round(item.vol * 100)}%</span>
                             </div>
                         ))}
                     </div>
                     
                     <div className="pt-6 border-t border-white/5 space-y-4">
                         <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white">{t.spatialAudio}</h4>
                             <button onClick={() => updateAmbience('is8DEnabled', !ambience.is8DEnabled)} className={`w-12 h-6 rounded-full relative transition-colors ${ambience.is8DEnabled ? 'bg-primary' : 'bg-slate-700'}`}>
                                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${ambience.is8DEnabled ? 'left-7' : 'left-1'}`}></div>
                             </button>
                         </div>
                         {ambience.is8DEnabled && (
                             <div className="flex items-center gap-4">
                                 <span className="text-xs font-bold text-slate-400 uppercase">{t.speed}</span>
                                 <input 
                                     type="range" min="0.1" max="5" step="0.1"
                                     value={ambience.spatialSpeed}
                                     onChange={(e) => updateAmbience('spatialSpeed', parseFloat(e.target.value))}
                                     className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full"
                                 />
                             </div>
                         )}
                     </div>
                 </div>
             )}
             
             {activeTab === 'fx' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      
                      {/* Mastering Section */}
                      <div className="space-y-4 bg-white/5 p-4 rounded-2xl">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest">{t.mastering || "Mastering & Dynamics"}</h4>
                          
                          {/* Compressor */}
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-bold text-white">{t.compressor || "Compressor"}</span>
                             <button onClick={() => setAudioEnhancements(prev => ({...prev, compressorEnabled: !prev.compressorEnabled}))} className={`w-10 h-5 rounded-full relative transition-colors ${audioEnhancements.compressorEnabled ? 'bg-secondary' : 'bg-slate-700'}`}>
                                 <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${audioEnhancements.compressorEnabled ? 'left-6' : 'left-1'}`}></div>
                             </button>
                          </div>
                          <div className={`space-y-3 transition-opacity duration-300 ${audioEnhancements.compressorEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                              <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase w-12">{t.threshold || "Threshold"}</span>
                                  <input 
                                      type="range" min="-60" max="0" step="1"
                                      value={audioEnhancements.compressorThreshold}
                                      onChange={(e) => setAudioEnhancements(p => ({...p, compressorThreshold: parseFloat(e.target.value)}))}
                                      className="flex-1 accent-secondary h-1.5 bg-black/40 rounded-full"
                                  />
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase w-12">{t.ratio || "Ratio"}</span>
                                  <input 
                                      type="range" min="1" max="20" step="0.5"
                                      value={audioEnhancements.compressorRatio}
                                      onChange={(e) => setAudioEnhancements(p => ({...p, compressorRatio: parseFloat(e.target.value)}))}
                                      className="flex-1 accent-secondary h-1.5 bg-black/40 rounded-full"
                                  />
                              </div>
                          </div>

                          <div className="w-full h-px bg-white/10 my-4"></div>

                          {/* HiFi Bass & Loudness */}
                          <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-white uppercase w-16">{t.hifiBass || "HiFi Bass"}</span>
                                  <input 
                                      type="range" min="0" max="20" step="1"
                                      value={audioEnhancements.bassBoost}
                                      onChange={(e) => setAudioEnhancements(p => ({...p, bassBoost: parseFloat(e.target.value)}))}
                                      className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full"
                                  />
                                  <span className="text-[9px] font-mono text-slate-500 w-6">+{audioEnhancements.bassBoost}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-white uppercase w-16">{t.loudness || "Loudness"}</span>
                                  <input 
                                      type="range" min="0" max="15" step="1"
                                      value={audioEnhancements.loudness}
                                      onChange={(e) => setAudioEnhancements(p => ({...p, loudness: parseFloat(e.target.value)}))}
                                      className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full"
                                  />
                                  <span className="text-[9px] font-mono text-slate-500 w-6">+{audioEnhancements.loudness}</span>
                              </div>
                          </div>
                      </div>

                      {/* Standard Reverb/Speed */}
                      <div className="space-y-4 p-4 bg-white/5 rounded-2xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.fx}</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-500 w-16 uppercase">Reverb</span>
                                <input type="range" min="0" max="1" step="0.05" 
                                    value={fxSettings.reverb} 
                                    onChange={(e) => setFxSettings({...fxSettings, reverb: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-500 w-16 uppercase">{t.speed}</span>
                                <input type="range" min="0.8" max="1.2" step="0.01" 
                                    value={fxSettings.speed} 
                                    onChange={(e) => setFxSettings({...fxSettings, speed: parseFloat(e.target.value)})}
                                    className="flex-1 accent-primary h-1.5 bg-black/40 rounded-full"
                                />
                            </div>
                        </div>
                     </div>
                 </div>
             )}

             {activeTab === 'timer' && (
                 <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                     
                     <div className="w-full bg-white/5 p-6 rounded-3xl border border-white/5">
                         <h3 className="text-xl font-bold text-white mb-6 text-center uppercase tracking-widest flex items-center justify-center gap-2"><ClockIcon className="w-6 h-6 text-indigo-400" /> {t.sleepTimer}</h3>
                         <div className="grid grid-cols-3 gap-3 mb-6">
                             {[15, 30, 45, 60, 90, 120].map(min => (
                                 <button 
                                    key={min}
                                    onClick={() => setSleepTimer(min)}
                                    className={`py-4 rounded-xl text-lg font-bold transition-all ${sleepTimer === min ? 'bg-indigo-500 text-white shadow-lg' : 'bg-black/40 text-slate-400 hover:bg-white/10'}`}
                                 >
                                     {min} m
                                 </button>
                             ))}
                         </div>
                         {sleepTimer && (
                             <div className="text-center">
                                 <p className="text-4xl font-black text-white mb-4 animate-pulse">{sleepTimer} min</p>
                                 <button onClick={() => setSleepTimer(null)} className="px-6 py-2 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/40 transition-all">{t.turnOffTimer}</button>
                             </div>
                         )}
                     </div>

                     <div className="w-full bg-white/5 p-6 rounded-3xl border border-white/5">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2"><BellIcon className="w-6 h-6 text-red-400" /> {t.alarm}</h3>
                             <button onClick={() => updateAlarm('enabled', !alarm.enabled)} className={`w-14 h-7 rounded-full relative transition-colors ${alarm.enabled ? 'bg-green-500' : 'bg-slate-700'}`}>
                                 <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${alarm.enabled ? 'left-8' : 'left-1'}`}></div>
                             </button>
                         </div>
                         
                         <div className={`transition-all duration-300 ${alarm.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                             <div className="flex justify-center mb-6">
                                 <input 
                                     type="time" 
                                     value={alarm.time}
                                     onChange={(e) => updateAlarm('time', e.target.value)}
                                     className="bg-black/40 text-white text-5xl font-black rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50"
                                 />
                             </div>
                             <div className="flex justify-between gap-1">
                                 {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => (
                                     <button 
                                         key={day}
                                         onClick={() => toggleAlarmDay(i)}
                                         className={`w-10 h-10 rounded-full text-[10px] font-bold uppercase flex items-center justify-center transition-all ${alarm.days.includes(i) ? 'bg-primary text-white shadow-lg' : 'bg-black/40 text-slate-500 hover:bg-white/10'}`}
                                     >
                                         {day.charAt(0)}
                                     </button>
                                 ))}
                             </div>
                             {alarm.enabled && (
                                 <p className="text-center text-xs text-green-400 font-bold mt-6 uppercase tracking-widest animate-pulse">
                                     {t.alarm_set} {alarm.time}
                                 </p>
                             )}
                         </div>
                     </div>

                 </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default ToolsPanel;
