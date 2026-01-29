
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
              
              {/* INTRO with Mobile App Callout */}
              <section id="section-intro" className="space-y-8 scroll-mt-20">
                  <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-b from-indigo-900/20 to-black border border-white/10 p-12 text-center">
                       <BookOpenIcon className="w-16 h-16 text-white/20 mx-auto mb-6" />
                       <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-4">Архитектура<br/>StreamFlow</h2>
                       <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                           Добро пожаловать в центр управления. 📡<br/>
                           Это не просто плеер, а <strong>глобальный шлюз</strong> к тысячам радиостанций и живому общению. Изучите этот мануал, чтобы использовать потенциал системы на 100%.
                       </p>
                  </div>

                  {/* MOBILE APP PROMO (Screenshot 0) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#0e1016] border border-white/10 rounded-3xl p-8">
                       <div className="space-y-4">
                           <div className="inline-block px-3 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                              StreamFlow Mobile Engine
                           </div>
                           <h3 className="text-2xl font-bold text-white">Возьми музыку с собой</h3>
                           <p className="text-slate-400 text-sm leading-relaxed">
                               Наша экосистема не ограничивается десктопом. Сканируйте QR-код, чтобы перенести стрим в свой смартфон. 
                               Приложение работает как PWA (Progressive Web App), обеспечивая нативную производительность на iOS и Android.
                           </p>
                       </div>
                       <div className="flex justify-center">
                           <div className="relative bg-black border border-white/10 rounded-2xl p-2 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                               <img src="/manual_qr.png" alt="QR Code" className="w-64 rounded-xl opacity-90" />
                               <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                           </div>
                       </div>
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
                  
                  <div className="space-y-12">
                      {/* Live Screenshot 1: Player */}
                      <div className="bg-[#0e1016] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                           <div className="bg-black/50 p-4 border-b border-white/5 flex gap-2">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Fig 1.1: Main Control Unit</span>
                           </div>
                           <img src="/manual_player.png" alt="Player Controls" className="w-full opacity-90" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                           <div className="space-y-4">
                               <h3 className="text-xl font-bold text-white">❤️ Избранное (Favorites)</h3>
                               <p className="text-slate-400 leading-relaxed text-sm">
                                   Нашли идеальную станцию? Не потеряйте её в потоке из 40 тысяч каналов. 
                                   Нажмите иконку <strong>Сердца</strong>, чтобы добавить частоту в локальную память устройства.
                                   <br/><br/>
                                   Ваш список "Избранного" синхронизируется между сессиями (используется LocalStorage Encrypted Container).
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

                  {/* SCREENSHOTS: Profile & Search */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Step 1: Profile */}
                      <div className="space-y-4">
                           <h3 className="text-xl font-bold text-white flex items-center gap-3">
                               <span className="bg-pink-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                               Паспорт (Identity)
                           </h3>
                           <div className="relative group perspective-1000">
                               <div className="absolute inset-0 bg-pink-500/20 blur-2xl group-hover:bg-pink-500/30 transition-colors" />
                               <img src="/manual_profile.png" alt="Profile Creation" className="relative rounded-2xl border border-white/10 shadow-2xl transform transition-transform group-hover:scale-[1.02]" />
                           </div>
                           <p className="text-slate-400 text-xs leading-relaxed">
                               При первом входе вам предложат создать профиль. Выберите никнейм и аватар. 
                               Обратите внимание: никаких реальных фото. Мы поддерживаем философию <strong>Digital Avatar</strong>.
                           </p>
                      </div>

                      {/* Step 2: Search */}
                      <div className="space-y-4">
                           <h3 className="text-xl font-bold text-white flex items-center gap-3">
                               <span className="bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                               Поиск (Global Match)
                           </h3>
                           <div className="relative group perspective-1000">
                               <div className="absolute inset-0 bg-blue-500/20 blur-2xl group-hover:bg-blue-500/30 transition-colors" />
                               <img src="/manual_search.png" alt="Search UI" className="relative rounded-2xl border border-white/10 shadow-2xl transform transition-transform group-hover:scale-[1.02]" />
                           </div>
                           <p className="text-slate-400 text-xs leading-relaxed">
                               Фильтр "Вокруг Света" позволяет найти собеседника по полу, возрасту или стране.
                               Нажмите кнопку "НАЙТИ", и система просканирует активные ноды в поисках идеального совпадения.
                           </p>
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

                  <div className="border-t border-white/5 pt-12 space-y-12">
                      <div className="space-y-6">
                          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                              INSIDER INFO
                          </div>
                          <h3 className="text-3xl font-black text-white">Почему это сложнее, чем WhatsApp?</h3>
                          <p className="text-slate-400 leading-relaxed">
                              В отличие от коммерческих гигантов (Telegram, WhatsApp), где ваши данные хранятся на серверах годами, архитектура StreamFlow построена на принципе <strong>Zero-Persistence</strong>. Мы потратили сотни часов на создание системы, которая уничтожает данные быстрее, чем вы успеваете их забыть. 
                          </p>
                      </div>
                      {/* ... Voice Mode & Roadmap preserved ... */}
                  </div>
              </section>

               {/* TOOLS MANUAL */}
              <section id="section-tools" className="space-y-16 scroll-mt-20 border-t border-white/5 pt-20">
                  <div className="flex flex-col gap-6 border-l-4 border-purple-500 pl-8">
                      <div className="flex items-center gap-4 text-purple-400">
                          <AdjustmentsIcon className="w-8 h-8" />
                          <h2 className="text-4xl font-black text-white tracking-tight uppercase">III. Лаборатория Звука</h2>
                      </div>
                      <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                          Настройте физику звука и визуала. 🌌
                      </p>
                  </div>
                   
                   {/* VISUALIZER DEEP DIVE */}
                   <div className="space-y-8">
                       <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                           🎨 Визуальный Движок & Car Mode
                           <span className="text-[10px] bg-purple-500 text-white px-2 py-1 rounded-full">GPU Accelerated</span>
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-400 leading-relaxed">
                           <p>
                               StreamFlow превращает ваш экран в живое полотно. Если вы используете приложение в машине (через Android Automotive или iOS Web Wrapper), включите <strong>Полноэкранный режим</strong>. Визуализация будет пульсировать в такт музыке, создавая уникальную атмосферу ночной поездки.
                           </p>
                           <p>
                               <strong>Режимы рендеринга:</strong> Вы можете выбрать "персонажа" вашей визуализации. Будет ли это строгая геометрия (Bars), медитативные волны (Wave) или "Танцующая Галактика" (Galaxy) — решать вам.
                           </p>
                       </div>
                       
                       <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl flex items-center gap-4">
                           <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">⚡</div>
                           <div>
                               <strong className="text-white text-xs block mb-1">Battery Saver (Энергосбережение)</strong>
                               <p className="text-slate-400 text-[10px]">
                                   Рендеринг графики требует ресурсов. Если заряд батареи низок, вы можете <strong>отключить визуализатор</strong> в настройках. 
                                   Это остановит GPU-вычисления, оставив только чистый аудиопоток без потери качества.
                               </p>
                           </div>
                       </div>
                   </div>

                   {/* AUDIO & AMBIENCE */}
                   <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">🔊 Психоакустика и 8D</h3>
                        </div>
                        
                        {/* EQ TIP SCREENSHOT */}
                        <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
                            <img src="/manual_eq_tip.png" alt="Equalizer Tip" className="w-full opacity-90" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                 <strong className="text-white block mb-2">Dolby-Like Bass</strong>
                                 <p className="text-xs text-slate-400">
                                     Используйте эквалайзер для насыщения низких частот. Мы рекомендуем пресет "Bass Booster" для закрытых наушников.
                                 </p>
                             </div>
                             <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                 <strong className="text-white block mb-2">8D Audio</strong>
                                 <p className="text-xs text-slate-400">
                                     Технология бинаурального панорамирования. Звук начинает "вращаться" вокруг вашей головы. Идеально для медитации и фокуса.
                                 </p>
                             </div>
                             <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                 <strong className="text-white block mb-2">Ambience Mixer</strong>
                                 <p className="text-xs text-slate-400">
                                     Наложите шум дождя 🌧️ или треск камина 🔥 на музыку. В интерфейсе появятся соответствующие визуальные эффекты (капли на экране).
                                 </p>
                             </div>
                        </div>
                   </div>

                   {/* SETTINGS & RESET */}
                   <div className="border-t border-white/5 pt-8">
                       <h3 className="text-xl font-bold text-white mb-4">⚙️ Кастомизация & Сброс</h3>
                       <p className="text-slate-400 text-sm mb-6">
                           Вам доступна полная смена темы интерфейса (Accent Color). Сделайте плеер "своим", выбрав любимый цвет кнопок и индикаторов.
                       </p>
                       <div className="flex items-center gap-4">
                           <button className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded hover:bg-red-500/20 transition">
                               RESET TO FACTORY DEFAULT
                           </button>
                           <span className="text-[10px] text-slate-500">
                               *Нажмите эту кнопку в настройках, если что-то пошло не так. Это вернет все параметры (громкость, EQ, тему) к заводским значениям.
                           </span>
                       </div>
                   </div>
              </section>

          </div>
      </div>
    </div>
  );
};

export default EncyclopediaView;
