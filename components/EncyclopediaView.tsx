
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
                           <div className="relative bg-black border border-white/10 rounded-2xl p-2 shadow-2xl">
                               <img src="/manual_qr.webp" alt="QR Code" className="w-64 rounded-xl opacity-90" />
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
                      <div className="bg-[#0e1016] border border-white/10 rounded-3xl overflow-hidden shadow-2xl group">
                           <div className="bg-black/50 p-4 border-b border-white/5 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Fig 1.1: Main Control Unit (Active State)</span>
                              <div className="flex gap-1">
                                  <div className="w-2 h-2 rounded-full bg-red-500/20" />
                                  <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                              </div>
                           </div>
                           {/* REAL SCREENSHOT: Player Bar */}
                           <div className="relative p-6 bg-black">
                               <img src="/manual_player_bar.webp" alt="Player Controls" className="w-full rounded-lg shadow-lg border border-white/5 transform group-hover:scale-[1.01] transition-transform duration-500" />
                               
                               {/* Pointer / Description Overlay */}
                               <div className="absolute top-1/2 left-4 md:left-12 -translate-y-1/2 hidden md:block">
                                   <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                                       <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] px-2 py-1 rounded font-bold">LIVE STREAM 320kbps</span>
                                   </div>
                               </div>
                           </div>
                           <div className="p-6 bg-[#0e1016] border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
                               <div>
                                   <strong className="text-white block mb-1">Station Metadata</strong>
                                   Битрейт и формат (MP3/AAC) отображаются в реальном времени рядом с названием трека.
                               </div>
                               <div>
                                   <strong className="text-white block mb-1">Buffer Health</strong>
                                   Белая полоса загрузки показывает состояние кеша. Если она полная — разрывов связи не будет.
                               </div>
                               <div>
                                   <strong className="text-white block mb-1">Volume Normalization</strong>
                                   Слайдер громкости (справа) использует логарифмическую шкалу для плавного контроля дБ.
                               </div>
                           </div>
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
                               <h3 className="text-xl font-bold text-white">🎚️ Меню Управления</h3>
                               <div className="flex items-start gap-4">
                                   <img src="/manual_settings_icon.webp" className="w-12 h-12 rounded-lg border border-white/10 p-2 bg-black/50" alt="Settings Icon" />
                                   <p className="text-slate-400 leading-relaxed text-sm">
                                       Эта иконка открывает <strong>DSP-процессор</strong>. 
                                       Здесь скрыты настройки 8D-звука, эквалайзера и визуализации. Не бойтесь экспериментировать — кнопка Reset всегда вернет всё как было.
                                   </p>
                               </div>
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

                  {/* SCREENSHOTS: Search Modal & Dropdowns */}
                  <div className="space-y-8">
                      {/* SUB-SECTION: GLOBAL MATCH */}
                      <div className="bg-[#0e1016] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                           <div className="grid grid-cols-1 lg:grid-cols-2">
                               <div className="p-8 space-y-6 flex flex-col justify-center">
                                    <h3 className="text-2xl font-bold text-white">🌍 Глобальный Поиск (Global Match)</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Это сердце нашей социальной системы. Панель "Вокруг Света" позволяет настроить фильтры поиска собеседника с хирургической точностью.
                                    </p>
                                    <ul className="space-y-3 text-sm text-slate-300">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            <strong>Geo-Filtering:</strong> Выберите конкретную страну (например, Brazil или Japan), чтобы практиковать язык.
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            <strong>Age Bracket:</strong> Система соединит вас только с людьми из выбранного диапазона.
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            <strong>Online Status:</strong> Зеленый индикатор в углу подтверждает, что сеть активна.
                                        </li>
                                    </ul>
                               </div>
                               <div className="bg-black/50 p-8 flex items-center justify-center border-l border-white/5">
                                    {/* REAL SCREENSHOT: Search Modal */}
                                    <div className="relative">
                                        <img src="/manual_search_modal.webp" alt="Global Search Modal" className="rounded-xl shadow-2xl border border-white/10" />
                                        <div className="absolute -bottom-4 -right-4 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                            UI ELEMENT: SEARCH MODAL
                                        </div>
                                    </div>
                               </div>
                           </div>
                      </div>

                      {/* SUB-SECTION: DETAIL CONTROLS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* Age Select */}
                           <div className="bg-[#0e1016] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <AdjustmentsIcon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-white">Точность Возраста</h4>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <img src="/manual_age_select.webp" alt="Age Dropdown" className="w-1/3 rounded-lg border border-white/10 shadow-lg" />
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Мы не используем размытые диапазоны "18-25". Вы выбираете <strong>точный возраст</strong>. 
                                        Это позволяет находить сверстников с общими интересами и культурным кодом.
                                        <br/><br/>
                                        <span className="text-blue-400">*Если возраст не важен, выберите "Неважно".</span>
                                    </p>
                                </div>
                           </div>

                           {/* Menu Navigation */}
                           <div className="bg-[#0e1016] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <BookOpenIcon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-white">Навигация</h4>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="bg-black p-4 rounded-xl border border-white/10">
                                         <img src="/manual_menu_icon.webp" alt="Hamburger Menu" className="w-8 h-8 opacity-80" />
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Кнопка меню ("Гамбургер") — это ваш портал. Через неё осуществляется быстрый переход между:
                                        <br/>
                                        • Радио-тюнером<br/>
                                        • Глобальным чатом<br/>
                                        • Этой Энциклопедией
                                    </p>
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

                  <div className="border-t border-white/5 pt-12 space-y-12">
                      <div className="space-y-6">
                          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                               INSIDER INFO
                          </div>
                          
                          <h3 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                              Почему это сложнее, чем <span className="underline decoration-green-500/50">WhatsApp</span>?<br/>
                              <span className="text-2xl lg:text-3xl text-slate-500 font-light mt-2 block">Технический манифест архитектуры Zero-Persistence</span>
                          </h3>

                          {/* CHAPTER 1: THE CLOUD PARADOX */}
                          <div className="space-y-6 mt-8">
                              <h4 className="text-2xl font-bold text-amber-400 flex items-center gap-3">
                                  <span className="text-3xl">⚖️</span> Глава 1. Парадокс Удобства
                              </h4>
                              <div className="prose prose-invert max-w-none text-slate-300 leading-8 font-light text-lg">
                                  <p>
                                      Современные мессенджеры — это чудо инженерии. Они позволяют вам начать диалог на телефоне, продолжить его на ноутбуке и найти старое сообщение пятилетней давности за доли секунды.
                                      <br/><br/>
                                      <strong>Удобно?</strong> Невероятно. Мы все пользуемся ими каждый день для работы и общения с семьей.
                                      <br/>
                                      <strong>Приватно?</strong> Здесь есть нюанс.
                                  </p>
                                  <p>
                                      Разница между нами и гигантами индустрии — в архитектуре, а не в качестве. Чтобы обеспечить "облачную синхронизацию" и "вечную историю", данные неизбежно должны храниться на серверах. Даже при использовании E2EE (сквозного шифрования) сохраняется так называемая <em>Metadata</em>.
                                  </p>
                                  <div className="my-8 p-6 bg-amber-900/10 border-l-4 border-amber-500 italic text-slate-400">
                                      "Метаданные — это как конверт письма. Почтальон не читает, что внутри, но он видит, ОТ КОГО оно и КОМУ адресовано. В классических архитектурах это необходимо для маршрутизации и доставки уведомлений."
                                  </div>
                                  <p>
                                      В StreamFlow мы уважаем выбор пользователей, которым нужна история переписки. Но мы создали альтернативу для тех моментов, когда вы хотите быть уверены: <strong>после закрытия вкладки не останется даже цифровой тени.</strong>
                                  </p>
                              </div>
                          </div>

                          {/* CHAPTER 2: ZERO-PERSISTENCE */}
                          <div className="space-y-6">
                              <h4 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
                                  <span className="text-3xl">🧬</span> Глава 2. Философия Zero-Persistence
                              </h4>
                              <div className="prose prose-invert max-w-none text-slate-300 leading-8 font-light text-lg">
                                  <p>
                                      В StreamFlow мы пошли по пути радикального цифрового аскетизма. Наша архитектурная догма звучит так: <strong>"Данные существуют только в момент передачи"</strong>.
                                  </p>
                                  <p>
                                      Это невероятно сложно реализовать технически. Почему? Потому что мы сознательно лишили себя инструментов, которые используют обычные компании.
                                  </p>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                                      <li className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl">
                                          <strong className="block text-white text-xl mb-2">🧠 RAM-Only Execution</strong>
                                          <span className="text-sm">
                                              Наши серверы не имеют жестких дисков для хранения баз данных пользователей. Вся оперативная память (RAM) работает как <em className="text-blue-300">Volatile Memory</em>. Если кто-то выдернет шнур питания из нашего сервера — вся история чатов исчезнет мгновенно и безвозвратно. Нам физически нечего "сливать" или "показывать" по запросу, потому что на дисках записаны только нули.
                                          </span>
                                      </li>
                                      <li className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl">
                                          <strong className="block text-white text-xl mb-2">👻 The "Ghost" Effect</strong>
                                          <span className="text-sm">
                                              Как только вы закрываете вкладку браузера, ваш цифровой слепок уничтожается. У нас нет базы данных `users.db`, где хранится "User123". В следующий раз вы зайдете как новый человек. Это технический кошмар для разработчика (как синхронизировать состояние?), но рай для параноика.
                                          </span>
                                      </li>
                                  </ul>
                              </div>
                          </div>

                          {/* CHAPTER 3: THE BLIND POSTMAN */}
                          <div className="space-y-6">
                              <h4 className="text-2xl font-bold text-purple-400 flex items-center gap-3">
                                  <span className="text-3xl">🕵️</span> Глава 3. Протокол "Слепой Почтальон"
                              </h4>
                              <div className="prose prose-invert max-w-none text-slate-300 leading-8 font-light text-lg">
                                  <p>
                                      Мы разработали транспортный уровень на базе WebSockets + Ephemeral Session IDs.
                                      Представьте, что вы передаете записку в темной комнате.
                                  </p>
                                  <ol className="list-decimal pl-6 space-y-4 my-6 marker:text-purple-500">
                                      <li>
                                          <strong>Handshake (Рукопожатие):</strong> При входе клиент генерирует временную пару ключей (RSA-2048). Этот ключ живет ровно столько, сколько открыта вкладка.
                                      </li>
                                      <li>
                                          <strong>Tunnel (Туннель):</strong> Сообщение упаковывается в зашифрованный контейнер. Сервер видит только внешний слой: <code>{"{ to: 'Session_X', payload: 'ENCRYPTED_BLOB' }"}</code>.
                                      </li>
                                      <li>
                                          <strong>Relay (Пересылка):</strong> Сервер пересылает BLOB получателю, даже не пытаясь его расшифровать (у сервера нет приватных ключей пользователей).
                                      </li>
                                      <li>
                                          <strong>Self-Destruct (Уничтожение):</strong> После подтверждения доставки (ACK signal), сервер перезаписывает ячейку памяти мусором (garbage data), чтобы исключить восстановление даже методом криминалистического анализа оперативной памяти (Cold Boot Attack mitigation).
                                      </li>
                                  </ol>
                                  <p className="text-purple-300 border-t border-purple-500/20 pt-4 mt-4">
                                      Этот подход требует сложнейшей синхронизации. Если интернет моргнул на миллисекунду — сообщение может пропасть, потому что у нас нет "очереди отложенных сообщений" на диске. Это цена, которую мы платим за тотальную приватность.
                                  </p>
                              </div>
                          </div>

                          {/* CHAPTER 4: CONCLUSION */}
                          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#0f172a] to-black border border-white/10 p-10">
                              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                              <h4 className="relative z-10 text-3xl font-black text-white mb-6">Итог: Свобода стоит дорого</h4>
                              <p className="relative z-10 text-slate-400 text-lg leading-relaxed">
                                  Нам было бы в 100 раз проще использовать базу данных MongoDB или Firebase. Мы могли бы дать вам "историю сообщений", "синхронизацию с телефоном" и "облачные бэкапы". Но тогда мы стали бы ещё одним WhatsApp.
                                  <br/><br/>
                                  Мы выбрали трудный путь. Мы пишем код, который борется с самой природой цифрового следа. Мы не знаем, кто вы. Мы не знаем, о чем вы говорите. И мы гордимся этим незнанием.
                                  <br/><br/>
                                  <span className="text-white font-bold">StreamFlow — это не продукт. Это убежище. 🏰</span>
                              </p>
                          </div>
                      </div>
                      {/* VOICE MODE */}
                      <div className="space-y-4 pt-12 border-t border-white/5">
                          <h4 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                             <span className="text-3xl">🗣️</span> Голос Машины (Voice Mode)
                          </h4>
                          <div className="prose prose-invert max-w-none text-slate-300 leading-7">
                              <p>
                                  Чат — это не только текст. Мы внедрили уникальный движок <strong>синтеза речи</strong> (Text-to-Speech), который позволяет "слышать" собеседника.
                              </p>
                              <div className="bg-yellow-900/10 border border-yellow-500/20 p-6 rounded-2xl my-4">
                                  <strong className="block text-white mb-2">Как это работает?</strong>
                                  <ul className="list-disc pl-4 space-y-2 text-sm text-slate-400">
                                      <li>Найдите иконку <span className="text-yellow-400">Динамика</span> в шапке чата.</li>
                                      <li>Нажмите её, чтобы активировать режим "Auto-Read".</li>
                                      <li>Теперь каждое входящее сообщение будет озвучиваться роботом.</li>
                                  </ul>
                                  <p className="mt-4 text-xs lg:text-sm italic text-yellow-200/80">
                                      "Это превращает обычный чат в уморительный диалог. Попробуйте попросить собеседника написать что-то смешное или сложное — роботизированный акцент добавляет особый шарм общению, заставляя улыбаться даже в самый хмурый день. 😂"
                                  </p>
                              </div>
                          </div>
                      </div>

                      {/* ROADMAP: WebRTC & AI */}
                      <div className="space-y-4 pt-8">
                          <h4 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                             <span className="text-3xl">🚀</span> Будущее: WebRTC и AI
                          </h4>
                          <div className="prose prose-invert max-w-none text-slate-300 leading-7">
                              <p>
                                  Мы не останавливаемся. Прямо сейчас в наших лабораториях кипит работа над архитектурой <strong>видео и аудио звонков</strong> нового поколения.
                              </p>
                              <p>
                                  Почему этого нет прямо сейчас? Потому что мы перфекционисты. Мы строим <strong>Mesh Network</strong> — систему, где видеопоток идет напрямую от пользователя к пользователю (P2P), минуя серверы. Это сложнейшая инженерная задача, требующая месяцев тестов, чтобы обеспечить качество 4K без задержек.
                              </p>
                              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-1000" />
                                  <h5 className="font-bold text-white text-lg mb-2 relative z-10">🤖 Сюрприз: AI-Ассистенты</h5>
                                  <p className="text-sm text-slate-400 relative z-10">
                                      Совсем скоро приложение станет "умным". Мы внедряем сложные алгоритмические модели (LLM), которые будут помогать вам в общении, переводить тексты на лету и даже подбирать музыку под настроение разговора. 
                                      <br/><br/>
                                      <span className="text-cyan-300 font-medium">Оставайтесь с нами. Обновление, которое изменит правила игры, уже близко. У вас не будет причин закрывать это приложение. 😉</span>
                                  </p>
                              </div>
                          </div>
                      </div>
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
                            <img src="/manual_eq_tip.webp" alt="Equalizer Tip" className="w-full opacity-90" />
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
