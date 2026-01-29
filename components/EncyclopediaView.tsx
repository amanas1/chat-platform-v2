
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
    { id: 'intro', title: 'Введение и PWA', icon: <BookOpenIcon className="w-5 h-5" /> },
    { id: 'gis', title: 'ГИС и Навигация', icon: <GlobeIcon className="w-5 h-5" /> },
    { id: 'audio', title: 'Аудио-движок и DSP', icon: <MusicNoteIcon className="w-5 h-5" /> },
    { id: 'chat', title: 'Приватный Чат (E2EE)', icon: <ChatBubbleIcon className="w-5 h-5" /> },
    { id: 'tools', title: 'Инструментарий', icon: <AdjustmentsIcon className="w-5 h-5" /> },
    { id: 'security', title: 'Техническая безопасность', icon: <ShieldCheckIcon className="w-5 h-5" /> },
    { id: 'legal', title: 'Юридический кодекс', icon: <LifeBuoyIcon className="w-5 h-5" /> },
  ];

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);

    // Dynamic active section detection
    const elements = sections.map(s => document.getElementById(`section-${s.id}`));
    const current = elements.findIndex(el => el && el.getBoundingClientRect().top > 0);
    if (current !== -1) {
        // Simple logic: the first section that is mostly on screen
        // In a real app we'd use IntersectionObserver
    }
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
      {/* Scroll Progress Bar (Top) */}
      <div className="absolute top-0 left-0 h-1 bg-primary z-[70] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />

      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5 bg-white/5">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-widest"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Назад
              </button>
              <h1 className="text-lg font-black text-white tracking-tighter leading-none">STREAMFLOW<br/><span className="text-[10px] text-primary tracking-[0.3em]">REFERENCE</span></h1>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
              {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {s.icon}
                    <span className="truncate">{s.title}</span>
                  </button>
              ))}
          </nav>

          <div className="p-6 border-t border-white/5 opacity-30">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">v2.0 Revision Alpha</p>
          </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-slate-950/20 scroll-smooth relative"
      >
          <div className="max-w-4xl mx-auto p-12 space-y-24 pb-48">
              
              {/* Header Visual */}
              <section id="section-intro" className="space-y-8 scroll-mt-20">
                  <div className="aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-3xl bg-slate-900 group relative">
                      <img src="/guide_cover_premium.png" alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent" />
                      <div className="absolute bottom-10 left-10">
                          <span className="px-4 py-1.5 rounded-full bg-primary text-[10px] font-black uppercase tracking-widest text-white mb-4 inline-block">Официальное издание</span>
                          <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">Энциклопедия<br/>StreamFlow</h2>
                      </div>
                  </div>

                  <div className="prose prose-invert max-w-none">
                      <p className="text-2xl text-slate-400 leading-relaxed font-light">
                          Добро пожаловать в наиболее полное руководство по устройству и эксплуатации системы **StreamFlow**. Это технический манифест, описывающий каждую шестеренку нашего «цифрового радио-института».
                      </p>
                      
                      <div className="grid grid-cols-3 gap-6 mt-12">
                          {[
                              { label: 'Станций', val: '40K+', sub: 'Глобальная база' },
                              { label: 'Задержка', val: '300ms', sub: 'Low Latency' },
                              { label: 'Шифрование', val: 'AES-256', sub: 'Военный стандарт' },
                          ].map((stat, i) => (
                              <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                  <div className="text-3xl font-black text-white">{stat.val}</div>
                                  <div className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">{stat.label}</div>
                                  <div className="text-xs text-slate-500 mt-2">{stat.sub}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </section>

              {/* SECTION: GIS */}
              <section id="section-gis" className="space-y-10 scroll-mt-20">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <GlobeIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight">2. ГИС-Навигация и Картография</h2>
                  </div>
                  
                  <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-6">
                      <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-primary pl-4">Цифровой Движок Карты</h3>
                      <p className="text-slate-300 leading-relaxed text-lg font-medium">
                          Карта StreamFlow базируется на векторном движке, который обрабатывает координаты более 40,000 радиостанций в реальном времени. Мы используем сложную **систему кластеризации**, которая объединяет близкие источники при отдалении, высвобождая ресурсы процессора для обработки звука.
                      </p>
                      
                      <div className="aspect-video rounded-3xl overflow-hidden border border-white/10">
                          <img src="/player_view.png" alt="Interface" className="w-full h-full object-cover" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                          <div className="space-y-4">
                              <h4 className="text-primary font-black uppercase tracking-widest">Инструменты Поиска</h4>
                              <ul className="space-y-3 text-slate-400">
                                  <li>• <strong className="text-white">Fuzzy Search:</strong> Поиск понимает опечатки и частичные совпадения.</li>
                                  <li>• <strong className="text-white">Гео-прыжок:</strong> Выбор страны мгновенно перемещает камеру в её центр.</li>
                              </ul>
                          </div>
                          <div className="space-y-4">
                              <h4 className="text-secondary font-black uppercase tracking-widest">AI Optimize ✨</h4>
                              <p className="text-slate-400">
                                  При активации AI, система Gemini анализирует текущий список станций. Она сверяет метаданные с базой стабильности и выводит наверх только те потоки, которые имеют битрейт выше 128kbps и доступность более 99%.
                              </p>
                          </div>
                      </div>
                  </div>
              </section>

              {/* SECTION: AUDIO */}
              <section id="section-audio" className="space-y-10 scroll-mt-20">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                          <CpuChipIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight">3. Лаборатория DSP и Аудио-тракт</h2>
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 space-y-10">
                      <div className="space-y-4">
                          <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-secondary pl-4">Web Audio API Pipeline</h3>
                          <p className="text-slate-300 leading-relaxed text-lg font-medium">
                              Звук в StreamFlow проходит через сложную цепочку узлов (Nodes) перед тем, как попасть в ваши динамики. Это позволяет нам накладывать эффекты без задержки и искажений.
                          </p>
                      </div>

                      <div className="bg-black/40 rounded-3xl p-8 border border-white/5">
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                             {['SOURCE', 'EQ FILTERS', '8D PANNER', 'MASTER GAIN', 'OUTPUT'].map((node, i) => (
                                 <React.Fragment key={i}>
                                     <div className="px-4 py-2 rounded-lg bg-white/10 text-[10px] font-black text-white border border-white/10 uppercase tracking-widest">{node}</div>
                                     {i < 4 && <div className="hidden md:block w-8 h-px bg-white/20" />}
                                 </React.Fragment>
                             ))}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                              <h4 className="text-2xl font-bold text-white italic">Режим 8D Audio</h4>
                              <p className="text-slate-400 leading-relaxed">
                                  Алгоритм динамически изменяет параметры `PositionX` и `PositionZ` в пространстве. Создается иллюзия, что источник звука физически вращается вокруг вас. Режимы регулировки скорости (Spatial Speed) позволяют настроить темп «вращения» под частоту вашего дыхания для максимального погружения.
                              </p>
                              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold leading-relaxed">
                                  ⚠️ ВНИМАНИЕ: Эффект 8D Audio максимально раскрывается только при прослушивании в качественных наушниках.
                              </div>
                          </div>
                          <div className="space-y-6">
                              <h4 className="text-2xl font-bold text-white italic">Микшер Атмосферы</h4>
                              <p className="text-slate-400 leading-relaxed">
                                  Каждый слой атмосферы (Rain, Fire, City, Vinyl) — это отдельный аудио-объект с собственным циклом затухания. Мы используем «розовый шум» для дождя, чтобы маскировать резкие бытовые звуки вокруг вас.
                              </p>
                              <div className="aspect-video rounded-3xl overflow-hidden border border-white/10">
                                  <img src="/acoustic_waves_visualizer.png" alt="Acoustics" className="w-full h-full object-cover" />
                              </div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* SECTION: CHAT */}
              <section id="section-chat" className="space-y-10 scroll-mt-20">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <ShieldCheckIcon className="w-6 h-6" />
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight">4. Приватность и Безопасность</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-6">
                          <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-emerald-500 pl-4">Протокол E2EE</h3>
                          <p className="text-slate-400 leading-relaxed font-medium">
                              Мы используем военный стандарт **AES-256**. Ключи расшифровки генерируются при старте сессии и никогда не покидают оперативную память вашего устройства. Сервер служит лишь «туннелем» для зашифрованного шума.
                          </p>
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] text-emerald-500 font-mono tracking-tighter">
                              [Session Start] → Generate Key Pair (Local) → Apply AES-256 → Tunneling → Remote Client Decryption (Local)
                          </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 space-y-6 text-center flex flex-col justify-center">
                          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Zero-Access Manifesto</h3>
                          <p className="text-slate-400 text-sm leading-relaxed">
                              У разработчиков **StreamFlow** технически отсутствует возможность прочитать вашу переписку, увидеть ваши фото или узнать ваше местоположение. Все данные эфемерны и стираются безвозвратно.
                          </p>
                          <div className="mx-auto w-16 h-1 w-full mt-4 bg-emerald-500/30 rounded-full" />
                      </div>
                  </div>

                  {/* Technical Schematic Highlight */}
                  <div className="p-10 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-8">
                      <div className="flex justify-between items-center">
                          <div>
                              <h4 className="text-2xl font-bold text-white tracking-tight">Техническая схема интерфейса</h4>
                              <p className="text-slate-500 text-sm">Внутреннее устройство управления потоками</p>
                          </div>
                          <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] text-slate-300 font-bold tracking-widest uppercase">Secret Draft</span>
                      </div>
                      <div className="aspect-[21/9] rounded-3xl overflow-hidden border border-white/5">
                          <img src="/technical_schematic_ui.png" alt="Schematic" className="w-full h-full object-cover opacity-80" />
                      </div>
                  </div>
              </section>

              {/* SECTION: LEGAL */}
              <section id="section-legal" className="py-20 border-t border-white/5 space-y-8 scroll-mt-20">
                    <div className="flex items-center gap-3 text-slate-500">
                        <LifeBuoyIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Code Jurisprudence</span>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none opacity-50">
                        <p>1. Система StreamFlow является инструментом доступа к публичным аудио-стримам. Разработчик проекта не несет ответственности за содержание трансляций радиостанций.</p>
                        <p>2. Использование сервиса анонимного чата подразумевает согласие с правилами взаимного уважения. Любая форма спама или деструктивного поведения приведет к локальной блокировке устройства на уровне IP/Fingerprint.</p>
                        <p>3. Все права на визуальное оформление, DSP-алгоритмы и архитектуру PWA защищены. 2025.</p>
                    </div>
              </section>

          </div>
      </div>
    </div>
  );
};

export default EncyclopediaView;
