
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { 
    ArrowLeftIcon, GlobeIcon, MusicNoteIcon, AdjustmentsIcon, 
    ChatBubbleIcon, ShieldCheckIcon, CpuChipIcon, BookOpenIcon,
    MoonIcon, LifeBuoyIcon, SearchIcon, UserIcon, HeartIcon,
    FireIcon, CloudIcon
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
    { id: 'intro', title: 'Введение', icon: <BookOpenIcon className="w-5 h-5" /> },
    { id: 'radio', title: 'Радио & Поиск', icon: <MusicNoteIcon className="w-5 h-5" /> },
    { id: 'chat_manual', title: 'Чат & Коннект', icon: <ChatBubbleIcon className="w-5 h-5" /> },
    { id: 'tools', title: 'Атмосфера DSP', icon: <AdjustmentsIcon className="w-5 h-5" /> },
    { id: 'legal', title: 'Кодекс (Бан)', icon: <ShieldCheckIcon className="w-5 h-5" /> },
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
    <div className="flex flex-1 min-h-0 bg-[#070b14] overflow-hidden relative font-sans">
      <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-[70]" style={{ width: `${scrollProgress}%` }} />

      {/* Professional Sidebar */}
      <div className="w-80 border-r border-white/5 bg-[#050608] flex flex-col shrink-0 z-20 hidden md:flex">
          <div className="p-8 border-b border-white/5 bg-white/[0.02]">
              <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em] group">
                <ArrowLeftIcon className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> ТЕРМИНАЛ
              </button>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">StreamFlow<span className="text-primary">.Guide</span></h1>
              <p className="text-xs text-slate-500 mt-2 font-mono">Интерактивное руководство v3.0</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left border border-transparent ${activeSection === s.id ? 'bg-white/5 text-white border-white/10 shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                  >
                    <div className={`${activeSection === s.id ? 'text-primary' : 'text-slate-600'}`}>
                        {s.icon}
                    </div>
                    <span className="truncate">{s.title}</span>
                  </button>
              ))}
          </nav>
      </div>

      {/* Content Area */}
      <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-[#090b10] scroll-smooth relative">
          <div className="max-w-4xl mx-auto p-8 md:p-16 space-y-32 pb-48">
              
              {/* Intro */}
              <section id="section-intro" className="space-y-8 scroll-mt-20">
                  <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-b from-indigo-900/20 to-black border border-white/10 p-12 text-center">
                       <BookOpenIcon className="w-16 h-16 text-white/20 mx-auto mb-6" />
                       <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-4">Архитектура<br/>StreamFlow</h2>
                       <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                           Добро пожаловать в центр управления. 📡<br/>
                           Это не просто плеер, а <strong>глобальный шлюз</strong> к тысячам радиостанций и живому общению. Изучите этот мануал, чтобы использовать потенциал системы на 100%.
                       </p>
                  </div>
              </section>

              {/* RADIO MANUAL */}
              <section id="section-radio" className="space-y-16 scroll-mt-20">
                  <div className="flex flex-col gap-6 border-l-4 border-blue-500 pl-8">
                      <div className="flex items-center gap-4 text-blue-400">
                          <GlobeIcon className="w-8 h-8" />
                          <h2 className="text-4xl font-black text-white tracking-tight uppercase">I. Глобальный Эфир</h2>
                      </div>
                      <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                          Представьте, что у вас есть доступ к 40,000 приемников по всей планете. 🌎
                          Модуль радио позволяет мгновенно перемещаться между культурами и жанрами.
                      </p>
                  </div>
                  
                  {/* VISUAL BREAK 1: Search Interface Simulation */}
                  <div className="space-y-8">
                      <div className="bg-[#0e1016] border border-white/10 rounded-3xl p-1 overflow-hidden shadow-2xl">
                          <div className="bg-[#0e1016] p-4 border-b border-white/5 flex gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500/20" />
                              <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                              <div className="w-3 h-3 rounded-full bg-green-500/20" />
                          </div>
                          {/* MOCKUP */}
                          <div className="p-8 bg-gradient-to-b from-blue-900/10 to-black flex justify-center">
                              <div className="w-full max-w-lg bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                                  <SearchIcon className="w-6 h-6 text-slate-500" />
                                  <div className="flex-1">
                                      <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Поисковый запрос</div>
                                      <div className="text-xl text-white font-mono">Jazz | Tokyo</div>
                                  </div>
                                  <div className="px-3 py-1 bg-white/10 rounded text-xs text-slate-300 font-bold">ENTER</div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                           <div className="space-y-4">
                               <h3 className="text-xl font-bold text-white">🔍 Умный Поиск</h3>
                               <p className="text-slate-400 leading-relaxed text-sm">
                                   Нажмите на иконку <strong>Глобуса</strong>. Система поддерживает <em>Fuzzy Search</em> — она поймет вас, даже если вы напишете "Lo-Fi" с ошибкой.
                                   <br/><br/>
                                   💡 <strong>Совет Профи:</strong> Попробуйте комбинировать жанр и страну, например, просто выбрав Японию в списке, вы погрузитесь в их локальную сцену.
                               </p>
                           </div>
                           <div className="space-y-4">
                               <h3 className="text-xl font-bold text-white">🎚️ Качество Звука</h3>
                               <p className="text-slate-400 leading-relaxed text-sm">
                                   В меню настроек (иконка ползунков) есть важный переключатель <strong>"High Bitrate"</strong>.
                                   <br/><br/>
                                   ✅ <strong>Включено:</strong> Только станции 128kbps+ (Кристальный звук).
                                   <br/>
                                   ❌ <strong>Выключено:</strong> Все станции (Полезно при плохом интернете).
                               </p>
                           </div>
                      </div>
                  </div>
              </section>

              {/* CHAT MANUAL */}
              <section id="section-chat_manual" className="space-y-16 scroll-mt-20">
                  <div className="flex flex-col gap-6 border-l-4 border-pink-500 pl-8">
                      <div className="flex items-center gap-4 text-pink-400">
                          <ChatBubbleIcon className="w-8 h-8" />
                          <h2 className="text-4xl font-black text-white tracking-tight uppercase">II. Приватная Связь</h2>
                      </div>
                      <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                          Создавайте анонимные мосты с другими слушателями. 💬
                          Здесь нет телефонов и email-адресов. Только ваш временный цифровой аватар.
                      </p>
                  </div>

                  {/* VISUAL BREAK 2: Chat Bubble Interaction Match */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                      <div className="lg:col-span-5 space-y-6">
                           <h3 className="text-2xl font-bold text-white">🤝 Как начать?</h3>
                           <ol className="space-y-6">
                               <li className="flex gap-4">
                                   <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-pink-500/30">1</div>
                                   <div>
                                       <strong className="text-white block mb-1">Паспорт (Identity)</strong>
                                       <p className="text-sm text-slate-400">При входе в чат заполните карточку: Имя (Ник), Возраст и Пол. Это ваш "бейдж" на эту сессию.</p>
                                   </div>
                               </li>
                               <li className="flex gap-4">
                                   <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-pink-500/30">2</div>
                                   <div>
                                       <strong className="text-white block mb-1">Поиск (Matching)</strong>
                                       <p className="text-sm text-slate-400">Нажмите "Поиск участников", чтобы увидеть, кто сейчас онлайн и слушает музыку вместе с вами.</p>
                                   </div>
                               </li>
                           </ol>
                      </div>

                      {/* LIVE UI: Message Simulation */}
                      <div className="lg:col-span-7 bg-[#0e1016] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5" />
                           <div className="space-y-6 relative z-10">
                               {/* Incoming */}
                               <div className="flex gap-4 items-end">
                                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">AL</div>
                                   <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-sm p-4 max-w-xs">
                                       <div className="text-[10px] text-blue-400 font-bold mb-1 uppercase">Alice • 24 • Female</div>
                                       <p className="text-slate-200 text-sm">Привет! 👋 Ты тоже слушаешь это Lo-Fi радио? Отличный вайб для работы.</p>
                                   </div>
                               </div>
                               
                               {/* Outgoing */}
                               <div className="flex gap-4 items-end flex-row-reverse">
                                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold">ME</div>
                                   <div className="bg-pink-600/20 border border-pink-500/20 rounded-2xl rounded-br-sm p-4 max-w-xs">
                                       <p className="text-white text-sm">Да, салют! 🎧 Очень успокаивает. Ты откуда?</p>
                                       <div className="text-[10px] text-pink-300/50 text-right mt-1">Read 12:42</div>
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>

                  <div className="p-8 bg-red-900/10 border border-red-500/20 rounded-2xl flex items-start gap-6">
                      <div className="p-3 bg-red-500/20 rounded-xl text-red-500 shrink-0">
                          <ShieldCheckIcon className="w-8 h-8" />
                      </div>
                      <div>
                          <h4 className="text-lg font-bold text-white mb-2">⛔ Зона "Ban Hammer"</h4>
                          <p className="text-slate-400 text-sm leading-relaxed mb-4">
                              Если собеседник ведет себя неадекватно, не терпите.
                              Нажмите на его аватар и выберите кнопку <strong className="text-red-400 border border-red-500/30 px-1 rounded bg-red-500/10">BLOCK</strong>.
                          </p>
                          <div className="flex gap-2">
                              <span className="px-2 py-1 bg-black/40 rounded text-[10px] text-slate-500">🚫 Мгновенное исчезновение</span>
                              <span className="px-2 py-1 bg-black/40 rounded text-[10px] text-slate-500">🔒 Блок по IP</span>
                          </div>
                      </div>
                  </div>

                  {/* SECTION: TECHNOLOGY & FUTURE (User Request) */}
                  <div className="border-t border-white/5 pt-12 space-y-12">
                      <div className="space-y-6">
                          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                              INSIDER INFO
                          </div>
                          <h3 className="text-3xl font-black text-white">Почему это сложнее, чем WhatsApp?</h3>
                          <p className="text-slate-400 leading-relaxed">
                              В отличие от коммерческих гигантов (Telegram, WhatsApp), где ваши данные хранятся на серверах годами, архитектура StreamFlow построена на принципе <strong>Zero-Persistence</strong>. Мы потратили сотни часов на создание системы, которая уничтожает данные быстрее, чем вы успеваете их забыть. 
                              <br/><br/>
                              Это сложнейшая инженерная задача — заставить сервер пересылать сообщения, "не читая" их. Мы добились совершенства в синхронизации: пока вы слушаете музыку, за кулисами работают алгоритмы, которые не снились стандартным мессенджерам.
                          </p>
                      </div>

                      {/* FEATURE: VOICE MODE - FUN & ENGAGING */}
                      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-32 bg-purple-500/20 blur-3xl rounded-full translate-x-12 -translate-y-12 group-hover:bg-purple-500/30 transition-colors" />
                           <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                               <div className="flex-1 space-y-4">
                                   <div className="flex items-center gap-3">
                                       <div className="p-2 bg-white/10 rounded-lg">
                                           <span className="text-2xl">🗣️</span>
                                       </div>
                                       <h4 className="text-2xl font-bold text-white">Голосовой Синтез</h4>
                                   </div>
                                   <p className="text-slate-300 leading-relaxed">
                                       Хотите повеселиться? Включите этот режим, и чат "оживет". 
                                       Система будет зачитывать входящие сообщения разными голосами (роботизированными или человеческими). 
                                       Это создает забавный эффект "присутствия", будто вы сидите с собеседником в одной комнате.
                                   </p>
                                   <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-900/30 px-3 py-2 rounded-lg border border-purple-500/30 w-fit">
                                       <span>ТРИГГЕР:</span>
                                       <span className="text-white">Нажмите иконку "Губы" 👄 в шапке чата</span>
                                   </div>
                               </div>
                               {/* GUI Mockup of toggle */}
                               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl transform rotate-2 transition-transform hover:rotate-0">
                                   <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-4 mb-4">
                                       <span className="text-xs font-bold text-slate-400 uppercase">Voice Mode</span>
                                       <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                       </div>
                                   </div>
                                   <div className="space-y-2">
                                       <div className="h-2 w-32 bg-white/10 rounded animate-pulse" />
                                       <div className="h-2 w-24 bg-white/10 rounded animate-pulse delay-75" />
                                   </div>
                               </div>
                           </div>
                      </div>

                      {/* ROADMAP: WebRTC & AI */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="p-6 border border-white/5 bg-white/[0.02] rounded-2xl space-y-4 hover:bg-white/[0.04] transition-colors">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        <CloudIcon className="w-5 h-5 text-emerald-400" />
                                        WebRTC: Видеозвонки
                                    </h4>
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/20 tracking-wider">IN DEV</span>
                                </div>
                                <p className="text-slate-400 text-xs leading-6 text-justify">
                                    Разработчик прямо сейчас архитектурует модуль видеосвязи. 
                                    Ожидайте кристально чистые звонки peer-to-peer без серверов-посредников. 
                                    Это сложная технология, требующая времени, но результат вас поразит.
                                </p>
                           </div>

                           <div className="p-6 border border-white/5 bg-white/[0.02] rounded-2xl space-y-4 hover:bg-white/[0.04] transition-colors">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        <CpuChipIcon className="w-5 h-5 text-amber-400" />
                                        AI Neural Core
                                    </h4>
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/20 tracking-wider">SECRET</span>
                                </div>
                                <p className="text-slate-400 text-xs leading-6 text-justify">
                                    Готовится сюрприз с внедрением сложных ИИ-алгоритмов. 
                                    Мы не будем раскрывать карты, но это изменит ваш опыт общения и прослушивания музыки. 
                                    Оставайтесь в приложении, чтобы не пропустить этот апдейт! 🚀
                                </p>
                           </div>
                      </div>
                  </div>
              </section>

               {/* TOOLS MANUAL */}
              <section id="section-tools" className="space-y-16 scroll-mt-20 border-t border-white/5 pt-20">
                  <div className="flex flex-col gap-6 border-l-4 border-purple-500 pl-8">
                      <div className="flex items-center gap-4 text-purple-400">
                          <AdjustmentsIcon className="w-8 h-8" />
                          <h2 className="text-4xl font-black text-white tracking-tight uppercase">III. Творческая Атмосфера</h2>
                      </div>
                      <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                          Настройте окружение под себя. 🌌<br/>
                          Визуал, звук дождя, таймеры сна — всё, чтобы создать идеальное пространство.
                      </p>
                  </div>
                   
                   {/* VISUAL BREAK 3: Visualizer Grid Simulation */}
                   <div className="bg-[#0e1016] border border-white/5 rounded-[2rem] p-10">
                        <h3 className="text-center text-white font-bold uppercase tracking-[0.2em] mb-8 text-sm opacity-50">Choose Your Visual Engine</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {/* Card 1 */}
                             <div className="aspect-square bg-black border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group hover:border-blue-500/50 transition-colors cursor-pointer">
                                 <div className="w-full h-16 flex items-end justify-center gap-1">
                                     {[...Array(8)].map((_,i) => (
                                         <div key={i} className="w-2 bg-blue-500 rounded-t-sm" style={{ height: `${Math.random()*100}%` }} />
                                     ))}
                                 </div>
                                 <span className="text-white font-bold">BARS</span>
                                 <span className="text-[10px] text-slate-500 text-center">Классический анализатор спектра</span>
                             </div>

                             {/* Card 2 */}
                             <div className="aspect-square bg-black border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group hover:border-purple-500/50 transition-colors cursor-pointer ring-2 ring-purple-500/20">
                                 <div className="w-full h-16 flex items-center justify-center">
                                      <div className="w-full h-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] rounded-full animate-pulse" />
                                 </div>
                                 <span className="text-white font-bold">WAVE</span>
                                 <span className="text-[10px] text-slate-500 text-center">Осциллограф. Минимализм.</span>
                             </div>

                             {/* Card 3 */}
                             <div className="aspect-square bg-black border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 group hover:border-pink-500/50 transition-colors cursor-pointer">
                                 <div className="relative w-16 h-16">
                                     <div className="absolute inset-0 bg-pink-500 blur-xl opacity-20 rounded-full" />
                                     <div className="absolute inset-0 flex items-center justify-center">✨</div>
                                 </div>
                                 <span className="text-white font-bold">GALAXY</span>
                                 <span className="text-[10px] text-slate-500 text-center">Частицы звездной пыли (GPU)</span>
                             </div>
                        </div>

                        <div className="mt-10 p-6 bg-white/[0.02] border-t border-white/5 flex flex-col md:flex-row gap-8 items-center justify-between">
                            <div className="space-y-2">
                                <h4 className="text-white font-bold flex items-center gap-2">
                                    <FireIcon className="w-4 h-4 text-orange-500" />
                                    Микшер Звуков
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm">Добавьте шум дождя, треск костра или гул города поверх музыки для полной изоляции.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center hover:bg-slate-700 transition">🌧️</button>
                                <button className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center hover:bg-slate-700 transition">🔥</button>
                                <button className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center hover:bg-slate-700 transition">🏙️</button>
                            </div>
                        </div>
                   </div>
              </section>

          </div>
      </div>
    </div>
  );
};

export default EncyclopediaView;
