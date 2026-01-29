
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { 
    ArrowLeftIcon, GlobeIcon, MusicNoteIcon, AdjustmentsIcon, 
    ChatBubbleIcon, ShieldCheckIcon, CpuChipIcon, BookOpenIcon,
    MoonIcon, LifeBuoyIcon
} from './Icons';

interface EncyclopediaViewProps {
  onBack: () => void;
  language: Language;
}

const EncyclopediaView: React.FC<EncyclopediaViewProps> = ({ onBack, language }) => {
  const [activeSection, setActiveSection] = useState('intro');
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'intro', title: 'Start', icon: <BookOpenIcon className="w-5 h-5" /> },
    { id: 'radio', title: 'Радио: Как пользоваться', icon: <MusicNoteIcon className="w-5 h-5" /> },
    { id: 'chat_manual', title: 'Чат: Пошаговая инструкция', icon: <ChatBubbleIcon className="w-5 h-5" /> },
    { id: 'tools', title: 'Инструментарий', icon: <AdjustmentsIcon className="w-5 h-5" /> },
    { id: 'legal', title: 'Правила (Бан/Блок)', icon: <ShieldCheckIcon className="w-5 h-5" /> },
  ];

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isRu = language === 'ru';
  if (!isRu) return <div className="p-8 text-white">Only Russian supported for Encyclopedia v2.0.</div>;

  return (
    <div className="flex flex-1 min-h-0 bg-[#070b14] overflow-hidden relative">
      <div className="absolute top-0 left-0 h-1 bg-primary z-[70] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5 bg-white/5">
              <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-widest">
                <ArrowLeftIcon className="w-4 h-4" /> Назад
              </button>
              <h1 className="text-lg font-black text-white tracking-tighter leading-none">USER GUIDE<br/><span className="text-[10px] text-primary tracking-[0.3em]">WALKTHROUGH</span></h1>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
              {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeSection === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {s.icon}
                    <span className="truncate">{s.title}</span>
                  </button>
              ))}
          </nav>
      </div>

      {/* Content */}
      <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-slate-950/20 scroll-smooth relative">
          <div className="max-w-4xl mx-auto p-12 space-y-24 pb-48">
              
              {/* Intro */}
              <section id="section-intro" className="space-y-8 scroll-mt-20">
                  <div className="aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl bg-slate-900 group relative">
                      <img src="/guide_cover_premium.png" alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent" />
                      <div className="absolute bottom-10 left-10">
                          <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">Руководство<br/>Пользователя</h2>
                          <p className="text-slate-400 mt-2 text-lg">Пошаговое освоение StreamFlow: от первого клика до поиска друзей.</p>
                      </div>
                  </div>
              </section>

              {/* RADIO MANUAL */}
              <section id="section-radio" className="space-y-10 scroll-mt-20">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <MusicNoteIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight">1. Радио: Как это работает?</h2>
                  </div>
                  
                  <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-8">
                      {/* LIVE CUTOUT: Search Bar Focus */}
                      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
                          <div className="absolute top-3 left-4 z-10 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Зона 1: Поиск</div>
                          {/* CSS Crop of the main interface to show only top bar */}
                          <div className="h-32 overflow-hidden relative">
                               <img 
                                 src="/player_view.png" 
                                 alt="Search Interface" 
                                 className="w-[120%] max-w-none absolute -top-4 -left-4 opacity-80"
                               />
                               {/* Overlay Highlight */}
                               <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
                          </div>
                      </div>

                      <div className="space-y-6">
                          <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black shrink-0">1</div>
                              <div>
                                  <h4 className="text-white font-bold text-lg mb-2">Глобальный Поиск</h4>
                                  <p className="text-slate-400 leading-relaxed">Нажмите на иконку <GlobeIcon className="inline w-4 h-4 text-blue-400"/> в шапке. Введите жанр (<em>Lo-Fi, Jazz</em>) или страну.</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* CHAT MANUAL - THE CORE REQUEST */}
              <section id="section-chat_manual" className="space-y-10 scroll-mt-20">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                          <ChatBubbleIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight">2. Чат: Пошаговый доступ</h2>
                  </div>

                  {/* Step 1: Registration (LIVE UI SIMULATION) */}
                  <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden">
                      <div className="p-10 pb-6">
                          <h3 className="text-3xl font-black text-white mb-4">Шаг 1: Цифровой Паспорт</h3>
                          <p className="text-slate-400 text-lg leading-relaxed">
                             Вместо скриншота, вот <strong>интерактивная копия</strong> окна регистрации. Заполните эти поля при входе.
                          </p>
                      </div>
                      
                      {/* THE PHANTOM UI - Re-creating the exact modal look */}
                      <div className="w-full border-t border-white/5 bg-[#0f1014] p-10 flex justify-center py-16 relative overflow-hidden">
                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #7c3aed 0%, transparent 50%)' }} />
                          
                          <div className="w-full max-w-sm bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative z-10 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                              <div className="text-center mb-6">
                                  <h4 className="text-xl font-black text-white tracking-tight">Регистрация</h4>
                                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Доступ к сети</p>
                              </div>
                              <div className="space-y-4">
                                  <div className="space-y-1">
                                      <label className="text-[10px] text-slate-400 font-bold ml-2">ИМЯ / НИКНЕЙМ</label>
                                      <div className="h-10 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 text-slate-300 text-sm">Alex_Runner_2049</div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                          <label className="text-[10px] text-slate-400 font-bold ml-2">ВОЗРАСТ</label>
                                          <div className="h-10 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 text-slate-300 text-sm">24</div>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[10px] text-slate-400 font-bold ml-2">ПОЛ</label>
                                          <div className="h-10 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 text-slate-300 text-sm">Мужской</div>
                                      </div>
                                  </div>
                                  <button className="w-full h-12 bg-primary hover:bg-primary/80 rounded-xl text-white font-bold uppercase tracking-widest text-xs mt-2 shadow-lg shadow-primary/20">
                                      Создать Профиль
                                  </button>
                              </div>
                              {/* Overlay Pointer */}
                              <div className="absolute -right-12 top-10 bg-white text-black px-3 py-1 rounded-l-full text-[10px] font-black shadow-xl">ВАШИ ДАННЫЕ</div>
                          </div>
                      </div>
                  </div>

                  {/* Step 2: Etiquette & Blocking */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8 space-y-4">
                           <div className="flex items-center gap-3 text-red-400 mb-2">
                               <ShieldCheckIcon className="w-6 h-6" />
                               <h4 className="font-black uppercase tracking-widest">Правила Этикета</h4>
                           </div>
                           <p className="text-slate-300 leading-relaxed">
                               Пожалуйста, ведите беседу вежливо. Любые оскорбления или подозрительное поведение могут привести к блокировке.
                           </p>
                           <p className="text-white font-bold bg-red-500/20 p-4 rounded-xl border border-red-500/20">
                               ❗ Если другой пользователь нажмет кнопку "Block", вы исчезнете для него навсегда. Если таких жалоб будет много — система наложит на вас Глобальный Бан.
                           </p>
                      </div>

                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2rem] p-8 space-y-4">
                           <div className="flex items-center gap-3 text-blue-400 mb-2">
                               <ChatBubbleIcon className="w-6 h-6" />
                               <h4 className="font-black uppercase tracking-widest">Поиск Собеседника</h4>
                           </div>
                           <p className="text-slate-300 leading-relaxed">
                               Ввиду коллективного общения, вы можете искать пару.
                           </p>
                           <ul className="space-y-3 mt-4">
                               <li className="flex items-center gap-2 text-slate-400">
                                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                   Нажмите на форму <strong>"Поиск участников"</strong>
                               </li>
                               <li className="flex items-center gap-2 text-slate-400">
                                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                   Выберите критерий: <strong>По возрасту</strong> или <strong>По полу</strong>.
                               </li>
                               <li className="flex items-center gap-2 text-slate-400">
                                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                   Система подсветит подходящих пользователей зеленым маячком.
                               </li>
                           </ul>
                      </div>
                  </div>
              </section>

               {/* TOOLS MANUAL */}
              <section id="section-tools" className="space-y-10 scroll-mt-20">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                          <AdjustmentsIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight">3. Инструменты</h2>
                  </div>
                   <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-4">
                             <h3 className="text-2xl font-bold text-white">Визуализаторы и Таймеры</h3>
                             <p className="text-slate-400">
                                 В разделе настроек вы можете выбрать визуальный стиль волны.
                             </p>
                             <ul className="space-y-2 text-slate-400">
                                 <li>• <strong>Wave:</strong> Классическая линия.</li>
                                 <li>• <strong>Bars:</strong> Столбцы частот.</li>
                                 <li>• <strong>Galaxy:</strong> Частицы (требует мощный телефон).</li>
                             </ul>
                        </div>
                        <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden border border-white/10">
                            <img src="/acoustic_waves_visualizer.png" alt="Tools" className="w-full h-full object-cover" />
                        </div>
                   </div>
              </section>

          </div>
      </div>
    </div>
  );
};

export default EncyclopediaView;
