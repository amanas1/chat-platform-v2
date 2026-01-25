
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { XMarkIcon, MusicNoteIcon, UsersIcon, AdjustmentsIcon, PaletteIcon, PlayIcon, CloudIcon, GlobeIcon, BellIcon, LifeBuoyIcon, MoonIcon, MapIcon } from './Icons';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onShowFeature?: (featureId: string) => void;
}

const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose, language, onShowFeature }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!isOpen) return null;

  // Defines the content based on language
  const isRu = language === 'ru';

  const sections = isRu ? [
    { 
        id: 'radio',
        icon: <MusicNoteIcon className="w-6 h-6 text-pink-500" />, 
        title: "Глобальное Радио",
        content: "Это сердце приложения. В вашем распоряжении тысячи станций со всей планеты. Используйте меню слева, чтобы выбрать то, что нужно именно сейчас: 'Жанры' для стиля, 'Эпохи' для ностальгии или 'Настроение' для фона. Нашли что-то стоящее? Жмите сердечко, чтобы сохранить в Избранное." 
    },
    { 
        id: 'timer',
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />, 
        title: "Таймер Сна", 
        content: "Любите засыпать под музыку? Зайдите в панель инструментов (иконка настроек внизу), выберите вкладку с часами и установите таймер. Музыка плавно выключится сама, когда вы уже будете видеть сны." 
    },
    { 
        id: 'alarm',
        icon: <BellIcon className="w-6 h-6 text-red-400" />, 
        title: "Умный Будильник", 
        content: "Просыпайтесь правильно. Там же, где и таймер, можно настроить будильник. Выберите время и дни недели, и приложение включит вашу любимую станцию в назначенный час. Главное — оставьте вкладку открытой (даже в фоновом режиме)." 
    },
    { 
        id: 'ambience',
        icon: <CloudIcon className="w-6 h-6 text-blue-400" />, 
        title: "Атмосфера и Фокус", 
        content: "Хотите больше уюта? Иконка облака открывает микшер фоновых звуков. Добавьте шум дождя к джазу или треск костра к эмбиенту. А функция '8D Audio' заставит звук вращаться вокруг вас (обязательно наденьте наушники!)." 
    },
    { 
        id: 'chat',
        icon: <UsersIcon className="w-6 h-6 text-purple-500" />, 
        title: "Приватный Чат", 
        content: "Музыка объединяет. Нажмите на иконку сообщения вверху. Заполните профиль и ищите людей по интересам или странам. 'Барабан открытий' поможет найти случайного собеседника. Всё общение происходит только по взаимному согласию." 
    },
    { 
        id: 'visualizer',
        icon: <PlayIcon className="w-6 h-6 text-yellow-500" />, 
        title: "Визуализация", 
        content: "Музыку можно увидеть. Во вкладке 'Визуал' выберите один из режимов: от неоновых линий до танцующих фигур. Настройте яркость и реакцию на бит, чтобы создать свое световое шоу." 
    },
    { 
        id: 'eq',
        icon: <AdjustmentsIcon className="w-6 h-6 text-emerald-500" />, 
        title: "Настройка Звука", 
        content: "Вам доступен 10-полосный эквалайзер. Усильте басы для электроники или сделайте звук чище для классики. Вы — звукорежиссер своего эфира." 
    },
    { 
        id: 'appearance',
        icon: <PaletteIcon className="w-6 h-6 text-amber-500" />, 
        title: "Внешний Вид", 
        content: "Сделайте приложение своим. Меняйте цветовые темы, переключайтесь между светлым и темным режимом, регулируйте прозрачность блоков. Интерфейс подстраивается под вас." 
    },
  ] : [
    { 
        id: 'radio',
        icon: <MusicNoteIcon className="w-6 h-6 text-pink-500" />, 
        title: "Radio Stream",
        content: "The core of the app. Browse thousands of stations via the left sidebar. Choose 'Genres' for style, 'Eras' for nostalgia, or 'Moods' for vibe. Found something great? Hit the heart icon to save it to Favorites." 
    },
    { 
        id: 'timer',
        icon: <MoonIcon className="w-6 h-6 text-indigo-400" />, 
        title: "Sleep Timer", 
        content: "Drift off peacefully. Open the Tools Panel (settings icon at bottom right), go to the Clock tab, and set a timer. The music will stop automatically allowing you to sleep without worry." 
    },
    { 
        id: 'alarm',
        icon: <BellIcon className="w-6 h-6 text-red-400" />, 
        title: "Alarm Clock", 
        content: "Wake up to your favorite rhythm. Located in the same Clock tab. Set the time and days, and the app will play the last active station. Note: The app needs to be open (background is fine) to work." 
    },
    { 
        id: 'ambience',
        icon: <CloudIcon className="w-6 h-6 text-blue-400" />, 
        title: "Ambience Mixer", 
        content: "Create your perfect atmosphere. The Cloud tab lets you layer sounds like Rain, Fire, or City noise over your music. Try '8D Audio' with headphones for a surround sound experience." 
    },
    { 
        id: 'chat',
        icon: <UsersIcon className="w-6 h-6 text-purple-500" />, 
        title: "Chat & Connect", 
        content: "Music connects us. Tap the Chat icon (top right). Create a profile to find listeners by country or age. Use the 'Discovery Drum' to find random peers. All chats require mutual consent." 
    },
    { 
        id: 'visualizer',
        icon: <PlayIcon className="w-6 h-6 text-yellow-500" />, 
        title: "Visualizer", 
        content: "See the music. In the Paintbrush tab, choose from various visual effects like Galaxy or Neon Lines. Adjust speed and brightness to create your personal light show." 
    },
    { 
        id: 'eq',
        icon: <AdjustmentsIcon className="w-6 h-6 text-emerald-500" />, 
        title: "Equalizer", 
        content: "Fine-tune the audio. Use the 10-band equalizer to boost bass or clarify vocals. You are the sound engineer of your stream." 
    },
    { 
        id: 'appearance',
        icon: <PaletteIcon className="w-6 h-6 text-amber-500" />, 
        title: "Appearance", 
        content: "Make it yours. Change color themes, toggle Dark/Light mode, or adjust card transparency. The interface adapts to your style." 
    },
  ];

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl glass-panel rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
              <h2 className="text-3xl font-extrabold text-white">{t.manualTitle}</h2>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                  <XMarkIcon className="w-8 h-8 text-white" />
              </button>
          </div>
          
          <div className="p-8 overflow-y-auto no-scrollbar space-y-8 flex-1">
              <p className="text-slate-300 text-xl leading-relaxed font-medium">{t.manualIntro}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {sections.map((s, i) => (
                      <div key={i} className="flex flex-col gap-4 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all h-full relative group">
                          <div className="flex items-center gap-4 mb-2">
                              <div className="w-14 h-14 shrink-0 rounded-2xl bg-black/40 flex items-center justify-center shadow-inner border border-white/5">
                                  {s.icon}
                              </div>
                              <h4 className="text-white font-bold text-xl leading-tight">{s.title}</h4>
                          </div>
                          <p className="text-base text-slate-300 leading-relaxed opacity-90 font-medium pb-8">{s.content}</p>
                          
                          {/* Show Where Button */}
                          <div className="absolute bottom-4 right-4 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => onShowFeature && onShowFeature(s.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-primary text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg"
                              >
                                  <MapIcon className="w-4 h-4" />
                                  {t.showWhere}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="p-6 border-t border-white/5 bg-white/5 text-center shrink-0">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">© 2025 StreamFlow Radio Engine • Administration</p>
          </div>
      </div>
    </div>
  );
};

export default ManualModal;
