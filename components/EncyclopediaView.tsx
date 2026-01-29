
import React from 'react';
import { XMarkIcon, ArrowLeftIcon } from './Icons';

interface EncyclopediaViewProps {
  onBack: () => void;
  language: string;
}

const EncyclopediaView: React.FC<EncyclopediaViewProps> = ({ onBack, language }) => {
  const isRu = language === 'ru';

  if (!isRu) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Encyclopedia is currently only available in Russian.</h2>
              <button onClick={onBack} className="text-primary font-bold">Back to Manual</button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/40">
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5 shrink-0">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
              <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">Энциклопедия StreamFlow</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-12 scroll-smooth">
          {/* Section 1 */}
          <section className="space-y-6">
              <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                  <img src="/guide_cover_premium.png" alt="Cover" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-4xl font-black text-white leading-tight">📘 Энциклопедия StreamFlow: Полное руководство</h1>
              <div className="flex justify-between items-center">
                  <p className="text-slate-400 text-lg leading-relaxed">Издание 1.0 | Для пользователей, исследователей и ценителей звука</p>
                  <div className="flex items-center gap-2 text-primary animate-bounce">
                      <span className="text-xs font-bold uppercase tracking-widest">Прокрутите вниз</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                  </div>
              </div>
          </section>

          <hr className="border-white/5" />

          {/* Section 2 */}
          <section className="space-y-6">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <span className="text-primary">🏛️</span> Раздел 1: Философия
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                  <strong>StreamFlow</strong> — это алгоритмическая попытка воссоздать глобальное единство через звук. Мы используем концепцию <strong>Shared Auditory Space</strong>, где каждый пользователь — часть живой сети.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                      { t: "Прозрачность", d: "Нет облачных баз" },
                      { t: "Анонимность", d: "E2EE Шифрование" },
                      { t: "Качество", d: "Lossless потоки" }
                  ].map((item, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                          <h4 className="font-bold text-white mb-1">{item.t}</h4>
                          <p className="text-xs text-slate-500">{item.d}</p>
                      </div>
                  ))}
              </div>
          </section>

          <hr className="border-white/5" />

          {/* Section 3 */}
          <section className="space-y-6">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                   <span className="text-secondary">🗺️</span> Раздел 2: Глобальная Консоль
              </h2>
              <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/10 bg-black/20">
                   <img src="/technical_schematic_ui.png" alt="Map View" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                  <h4 className="text-xl font-bold text-white">Вращение и Навигация</h4>
                  <p className="text-slate-400">Используйте ЛКМ для вращения сферы. При масштабировании срабатывает алгоритм кластеризации — крупные точки распадаются на отдельные станции.</p>
              </div>
          </section>

          <hr className="border-white/5" />

          {/* Section 4 */}
          <section className="space-y-6">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                   <span className="text-emerald-400">🔍</span> Раздел 3: Поиск и Мета-данные
              </h2>
              <p className="text-slate-400 leading-relaxed">
                  Поиск фильтрует массив из 30,000+ источников. Вы можете искать по жанру, городу или языку вещания. 
                  При выборе станции обращайте внимание на <strong>Bitrate</strong> — чем выше, тем чище звук.
              </p>
          </section>

          <hr className="border-white/5" />

          {/* Section 5 */}
          <section className="space-y-6">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                   <span className="text-pink-400">🎵</span> Раздел 4: Анатомия Плеера
              </h2>
              <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/10">
                   <img src="/player_view.png" alt="Player" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white/5 p-6 rounded-3xl space-y-4">
                  <p className="text-slate-300">Кнопка <strong>Play</strong> инициирует поток. Лента <strong>Status Bar</strong> показывает мета-данные трека. Если видите <em>Buffering</em> — дайте системе 3 секунды на кэш.</p>
              </div>
          </section>

          <hr className="border-white/5" />

          {/* Section 6 */}
          <section className="space-y-6">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                   <span className="text-blue-400">🎚️</span> Раздел 5: Акустическая Лаборатория
              </h2>
              <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/10">
                   <img src="/acoustic_waves_visualizer.png" alt="Acoustics" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                  <p className="text-slate-400">Микшер <strong>Ambience</strong> создает динамическую аудио-сцену. Ползунки управляют громкостью эффектов (Дождь, Огонь, Город). Движение вправо увеличивает интенсивность.</p>
              </div>
          </section>

          <hr className="border-white/5" />

          {/* Section 7 */}
          <section className="space-y-6">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                   <span className="text-indigo-400">🔐</span> Раздел 6: Безопасность
              </h2>
              <div className="p-8 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                  <h4 className="text-xl font-bold text-indigo-200">Zero-Access Encryption</h4>
                  <p className="text-slate-300">Ваши данные хранятся только в <strong>localStorage</strong> вашего браузера. У нас нет серверов с вашими переписками. Это архитектурно гарантированная анонимность.</p>
              </div>
          </section>

          <hr className="border-white/5" />

          {/* Section 8 */}
          <section className="space-y-6 pb-20">
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                   <span className="text-red-400">⚖️</span> Раздел 7: Юридическая часть
              </h2>
              <div className="text-sm text-slate-500 space-y-4 leading-relaxed">
                  <p>StreamFlow — технический агрегатор. Мы не контролируем редакционную политику станций. Ответственность за контент несут владельцы потоков.</p>
                  <p>Пользование чатом подразумевает соблюдение правил: никакой рекламы, спама или агрессии. Система модерации работает автоматически.</p>
              </div>
          </section>
      </div>
    </div>
  );
};

export default EncyclopediaView;
