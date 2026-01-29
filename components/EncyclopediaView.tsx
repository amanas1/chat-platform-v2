
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { 
    ArrowLeftIcon, GlobeIcon, MusicNoteIcon, AdjustmentsIcon, 
    ChatBubbleIcon, ShieldCheckIcon, CpuChipIcon, BookOpenIcon,
    MoonIcon, LifeBuoyIcon, SearchIcon, UserIcon
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
    { id: 'intro', title: 'Введение (Preface)', icon: <BookOpenIcon className="w-5 h-5" /> },
    { id: 'radio', title: 'Радио-Модуль (Tuner)', icon: <MusicNoteIcon className="w-5 h-5" /> },
    { id: 'chat_manual', title: 'Коммуникатор (Link)', icon: <ChatBubbleIcon className="w-5 h-5" /> },
    { id: 'tools', title: 'DSP и Инструменты', icon: <AdjustmentsIcon className="w-5 h-5" /> },
    { id: 'legal', title: 'Регламент (Legals)', icon: <ShieldCheckIcon className="w-5 h-5" /> },
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
      <div className="absolute top-0 left-0 h-1 bg-primary z-[70] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {/* Professional Sidebar */}
      <div className="w-72 border-r border-white/5 bg-[#050608] flex flex-col shrink-0 z-20">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-70 hover:opacity-100">
                <ArrowLeftIcon className="w-3 h-3" /> Вернуться в Терминал
              </button>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">DOCUMENTATION<br/><span className="text-[10px] text-primary tracking-[0.4em]">REFERENCE v2.4</span></h1>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
              {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left border border-transparent ${activeSection === s.id ? 'bg-primary/10 text-primary border-primary/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                  >
                    {s.icon}
                    <span className="truncate">{s.title}</span>
                  </button>
              ))}
          </nav>
          <div className="p-6 border-t border-white/5">
               <div className="text-[10px] text-slate-600 font-mono">
                   Build: 2026.01.29<br/>
                   Auth: Sys_Admin<br/>
                   Term: Localline
               </div>
          </div>
      </div>

      {/* Content Area */}
      <div ref={contentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-[#090b10] scroll-smooth relative">
          <div className="max-w-5xl mx-auto p-16 space-y-32 pb-48">
              
              {/* Intro */}
              <section id="section-intro" className="space-y-12 scroll-mt-20 border-b border-white/5 pb-20">
                  <div className="space-y-6">
                      <div className="inline-block px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 uppercase">System Manual</div>
                      <h2 className="text-6xl font-black text-white leading-tight tracking-tighter">Архитектура<br/>StreamFlow</h2>
                      <p className="text-xl text-slate-400 leading-relaxed font-light max-w-3xl">
                          Данное руководство предназначено для операторов и пользователей системы StreamFlow. 
                          Программный комплекс представляет собой высокоуровневую надстройку над глобальными протоколами потокового вещания (HLS/Icecast), 
                          объединенную с модулем сквозного шифрования (E2EE) для обеспечения приватной коммуникации. Изучение данной документации критически важно для эффективного использования всех функций терминала.
                      </p>
                  </div>
              </section>

              {/* RADIO MANUAL - EXPANDED */}
              <section id="section-radio" className="space-y-16 scroll-mt-20">
                  <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4 text-blue-400">
                          <MusicNoteIcon className="w-8 h-8" />
                          <h2 className="text-3xl font-black text-white tracking-tight uppercase">I. Модуль Глобального Тюнера</h2>
                      </div>
                      <p className="text-slate-400 text-sm leading-8 columns-1 md:columns-2 gap-12 text-justify">
                          Основой аудио-движка StreamFlow является модуль <strong className="text-white">Global Tuner</strong>. В отличие от примитивных плееров, использующих статические плейлисты, наш Тюнер работает как динамический поисковый агрегатор. Он в реальном времени сканирует метаданные более 40,000 узлов вещания по всему миру. Пользовательский интерфейс (UI) спроектирован так, чтобы минимизировать когнитивную нагрузку при навигации по этому массиву данных. 
                          <br/><br/>
                          Процесс взаимодействия начинается с инициализации поискового запроса. Система не загружает список станций целиком (что вызвало бы перегрузку памяти), а использует технологию «ленивой подгрузки» (Lazy Loading) и кластеризации гео-точек. Это позволяет мгновенно находить локальные станции в любой точке планеты, от Токио до Рейкьявика, сохраняя при этом мгновенный отклик интерфейса.
                      </p>
                  </div>
                  
                  <div className="bg-[#0e1016] border border-white/5 rounded-none p-0 overflow-hidden">
                      <div className="border-b border-white/5 bg-black/50 p-4 flex justify-between items-center">
                           <span className="text-[10px] font-mono text-slate-500 uppercase">Fig 1.1: Интерфейс навигации (Active State)</span>
                           <div className="flex gap-2">
                               <div className="w-2 h-2 rounded-full bg-red-500/20" />
                               <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                               <div className="w-2 h-2 rounded-full bg-green-500/20" />
                           </div>
                      </div>
                      
                      {/* LIVE CUTOUT: Search Bar Focus */}
                      <div className="relative bg-[#050608] p-12 flex justify-center">
                          <div className="w-full max-w-2xl relative rounded-md overflow-hidden border border-white/10 shadow-2xl">
                             <img 
                               src="/player_view.png" 
                               alt="Search Interface" 
                               className="w-full opacity-90"
                             />
                             {/* Tactical Overlay */}
                             <div className="absolute top-0 left-0 w-full h-16 border-b-2 border-blue-500 bg-blue-500/10 flex items-center justify-center">
                                 <span className="text-blue-200 text-xs font-bold bg-black/50 px-3 py-1 rounded border border-blue-500/30">ЗОНА ВВОДА ДАННЫХ</span>
                             </div>
                             <div className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-dashed border-yellow-500 animate-pulse" />
                          </div>
                      </div>

                      <div className="p-12 space-y-12 bg-[#0a0c10]">
                          <div className="grid grid-cols-12 gap-8">
                              <div className="col-span-1 text-4xl font-black text-white/10">01</div>
                              <div className="col-span-11 space-y-4">
                                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Инициализация Поиска</h3>
                                  <p className="text-slate-400 leading-relaxed text-sm">
                                      Для начала работы с глобальной базой необходимо активировать модальное окно навигации. Это делается путем нажатия на пиктограмму <GlobeIcon className="inline w-3 h-3 mx-1 text-white"/> <strong>Глобуса</strong>, расположенную в верхней панели управления (Top Toolbar). Обратите внимание: кнопка имеет тактильную обратную связь (Haptic Feedback) на мобильных устройствах.
                                      <br/><br/>
                                      После открытия окна перед вами появится поле ввода. Это не просто текстовый фильтр, а интеллектуальная система <strong>Fuzzy Search</strong> (нечеткого поиска). Вы можете вводить запросы с ошибками (например, "Jaz" вместо "Jazz"), и алгоритм все равно корректно интерпретирует ваше намерение, сопоставив его с тегами в базе данных.
                                  </p>
                              </div>
                          </div>

                          <div className="w-full h-px bg-white/5" />

                          <div className="grid grid-cols-12 gap-8">
                              <div className="col-span-1 text-4xl font-black text-white/10">02</div>
                              <div className="col-span-11 space-y-4">
                                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Параметрическая Фильтрация</h3>
                                  <p className="text-slate-400 leading-relaxed text-sm">
                                      В профессиональном использовании часто требуется отсеять станции с низким качеством сигнала. Для этого используйте меню <strong>Adjustments</strong>. Активация параметра "High Bitrate Only" принудительно исключает из выдачи все потоки с битрейтом ниже 128kbps (стандарт AAC+). 
                                      <br/><br/>
                                      Данная функция критически важна при прослушивании на Hi-Fi оборудовании, где артефакты сжатия MP3 становятся слышны. Мы рекомендуем оставлять этот фильтр включенным, если ваше интернет-соединение превышает 10 Мбит/с.
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* CHAT MANUAL - MASSIVE EXPANSION */}
              <section id="section-chat_manual" className="space-y-16 scroll-mt-20">
                  <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4 text-pink-400">
                          <ChatBubbleIcon className="w-8 h-8" />
                          <h2 className="text-3xl font-black text-white tracking-tight uppercase">II. Протокол Коммуникации</h2>
                      </div>
                      <p className="text-slate-400 text-sm leading-8 text-justify border-l-2 border-pink-500/20 pl-6">
                          Модуль чата в StreamFlow — это не просто мессенджер, а децентрализованная среда для анонимного обмена информацией. Мы отказались от классической модели "Логин/Пароль" в пользу сессионных цифровых идентификаторов. Это гарантирует, что ваша история переписки физически не может быть восстановлена после завершения сеанса.
                      </p>
                  </div>

                  {/* Step 1: Registration (LIVE UI SIMULATION) */}
                  <div className="bg-[#0e1016] border border-white/5 rounded-none overflow-hidden">
                      <div className="border-b border-white/5 bg-black/50 p-4 flex justify-between items-center">
                           <span className="text-[10px] font-mono text-slate-500 uppercase">Fig 2.1: Модальное окно инициализации сессии</span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2">
                          <div className="bg-[#050608] p-12 flex items-center justify-center border-r border-white/5">
                               {/* THE PHANTOM UI - Re-creating the exact modal look */}
                              <div className="w-full max-w-sm bg-black border border-white/10 rounded-sm p-8 shadow-2xl relative">
                                  <div className="text-center mb-8 border-b border-white/10 pb-4">
                                      <h4 className="text-lg font-black text-white tracking-widest uppercase">Identity Link</h4>
                                      <p className="text-[10px] font-mono text-slate-500 mt-2">SECURE CONNECTION REQUEST</p>
                                  </div>
                                  <div className="space-y-6">
                                      <div className="space-y-2">
                                          <div className="flex justify-between items-end">
                                               <label className="text-[10px] text-zinc-400 font-bold uppercase">Идентификатор (Nick)</label>
                                               <span className="text-[9px] text-zinc-600 font-mono">REQ*</span>
                                          </div>
                                          <div className="h-12 bg-white/[0.03] border border-white/10 flex items-center px-4 text-white text-sm font-mono focus-within:border-pink-500 transition-colors">Neo_User_01</div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Возраст</label>
                                              <div className="h-12 bg-white/[0.03] border border-white/10 flex items-center px-4 text-white text-sm font-mono">28</div>
                                          </div>
                                          <div className="space-y-2">
                                              <label className="text-[10px] text-zinc-400 font-bold uppercase">Гендер</label>
                                              <div className="h-12 bg-white/[0.03] border border-white/10 flex items-center px-4 text-white text-sm font-mono">Male</div>
                                          </div>
                                      </div>
                                      <button className="w-full h-14 bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest text-xs mt-4 shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2">
                                          <ShieldCheckIcon className="w-4 h-4" />
                                          Establish Uplink
                                      </button>
                                  </div>
                              </div>
                          </div>

                          <div className="p-12 space-y-8 bg-[#0a0c10]">
                              <h3 className="text-xl font-bold text-white uppercase tracking-wider">1. Создание Цифрового Слепка</h3>
                              <p className="text-slate-400 leading-7 text-sm">
                                  При входе в чат система требует заполнения так называемой <strong>"Карточки Видимости"</strong>. Учтите, что эти данные (Возраст, Пол, Страна) — единственное, что увидят другие участники сети. Мы намеренно убрали возможность загрузки аватаров, чтобы сместить фокус с внешности на суть общения.
                                  <br/><br/>
                                  <strong className="text-white">Важно:</strong> Поле "Имя" не требует паспортных данных. Мы рекомендуем использовать псевдонимы, отражающие ваши интересы, но не раскрывающие личность.
                              </p>
                              <div className="p-6 bg-pink-500/5 border border-pink-500/10 rounded text-xs text-pink-300 leading-relaxed font-mono">
                                  [SYSTEM_NOTE]: Указание ложного возраста (например, 99 лет) приведет к исключению вашего профиля из алгоритмов "поиска пары", так как система сочтет данные "шумом". Пожалуйста, вводите реальные значения для корректной работы мэтчинга.
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Step 2: Search & Etiquette */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <div className="space-y-8">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <SearchIcon className="w-5 h-5 text-blue-400" />
                                Алгоритмы Поиска (Matching)
                            </h3>
                            <div className="prose prose-invert prose-sm text-slate-400 leading-normal text-justify">
                                <p>
                                    Ввиду коллективного характера общения (Mesh-структура), вы находитесь в общем потоке. Однако система оснащена фильтрами "Активного Наведения". 
                                </p>
                                <p>
                                    Нажав на кнопку <strong className="text-white bg-white/10 px-1 rounded">ПОИСК УЧАСТНИКОВ</strong>, вы активируете сканирование активных сессий. Вы можете отфильтровать людей по критериям:
                                </p>
                                <ul className="list-none space-y-4 pl-0 mt-4">
                                    <li className="flex items-start gap-4 p-4 border border-white/5 bg-white/[0.02]">
                                        <UserIcon className="w-5 h-5 text-blue-500 shrink-0" />
                                        <div>
                                            <strong className="block text-white text-xs uppercase mb-1">Peer Discovery (Пол)</strong>
                                            Позволяет выделить в списке только пользователей определенного пола.
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 border border-white/5 bg-white/[0.02]">
                                        <AdjustmentsIcon className="w-5 h-5 text-purple-500 shrink-0" />
                                        <div>
                                            <strong className="block text-white text-xs uppercase mb-1">Age Range (Возраст)</strong>
                                            Скрывает пользователей, выходящих за рамки выбранного вами диапазона (например, +/- 5 лет).
                                        </div>
                                    </li>
                                </ul>
                            </div>
                       </div>

                       <div className="space-y-8">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <ShieldCheckIcon className="w-5 h-5 text-red-400" />
                                Протокол Безопасности
                            </h3>
                            <div className="prose prose-invert prose-sm text-slate-400 leading-normal text-justify">
                                <p>
                                    Безопасность в StreamFlow обеспечивается не модераторами, а самими участниками (Community Driven Security). Это означает, что ваша репутация — это ваш единственный актив.
                                </p>
                                <div className="border border-red-900/30 bg-red-900/10 p-6 rounded-sm space-y-4">
                                    <h4 className="text-red-400 font-bold uppercase text-xs tracking-wider">Механизм Блокировки (Blacklist)</h4>
                                    <p className="text-xs">
                                        Если другой пользователь нажмет кнопку <strong className="text-white">BLOCK</strong> в вашем профиле:
                                    </p>
                                    <ol className="list-decimal pl-4 space-y-2 text-xs marker:text-red-500">
                                        <li>Вы мгновенно исчезаете из его поля видимости.</li>
                                        <li>Ваши будущие сообщения для него будут блокироваться на уровне протокола шифрования.</li>
                                        <li>Если ваш "Индекс Блокировок" превысит порог в 10% от активной аудитории, ваш IP-адрес будет помещен в <strong>Shadow Ban</strong> (Теневой Бан) на 24 часа.</li>
                                    </ol>
                                </div>
                            </div>
                       </div>
                  </div>
              </section>

               {/* TOOLS MANUAL */}
              <section id="section-tools" className="space-y-16 scroll-mt-20 border-t border-white/5 pt-20">
                  <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4 text-purple-400">
                          <AdjustmentsIcon className="w-8 h-8" />
                          <h2 className="text-3xl font-black text-white tracking-tight uppercase">III. Анализатор Спектра (DSP)</h2>
                      </div>
                      <p className="text-slate-400 text-sm leading-8 columns-1 md:columns-2 gap-12 text-justify">
                           StreamFlow оснащен встроенным модулем цифровой обработки сигналов (DSP), который не только декодирует аудиопоток, но и визуализирует его. Визуализация — это не просто украшение, а инструмент анализа частотного баланса трека.
                      </p>
                  </div>
                   <div className="bg-[#0e1016] border border-white/5 rounded-none p-12 flex flex-col items-center gap-8">
                        <div className="w-full max-w-3xl aspect-[21/9] bg-black border border-white/10 relative overflow-hidden group">
                            <img src="/acoustic_waves_visualizer.png" alt="Tools" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity duration-700" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <span className="bg-black/80 text-white px-4 py-2 border border-white/20 text-xs font-mono uppercase">Render Mode: Waveform</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
                             {[
                                 { title: 'Wave', desc: 'Линейная амплитуда. Минимальная задержка.' },
                                 { title: 'Bars', desc: 'БПФ (Быстрое Преобразование Фурье). 64 полосы.' },
                                 { title: 'Galaxy', desc: 'Система частиц (GPU Accelerated). Эстетический режим.' }
                             ].map((mode, i) => (
                                 <div key={i} className="p-4 border border-white/10 bg-white/[0.02]">
                                     <strong className="block text-white text-xs uppercase mb-2">{mode.title}</strong>
                                     <p className="text-[10px] text-slate-500 leading-tight">{mode.desc}</p>
                                 </div>
                             ))}
                        </div>
                   </div>
              </section>

          </div>
      </div>
    </div>
  );
};

export default EncyclopediaView;
